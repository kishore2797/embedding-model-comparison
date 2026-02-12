"""Benchmark results and metrics routes."""

import asyncio
import json
import hashlib
from datetime import datetime, timezone

import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.models.schemas import BenchmarkResults, BenchmarkStatus
from app.benchmark.runner import get_run
from app.benchmark.cache import embedding_cache
from app.evaluation.embedding_quality import (
    compute_isotropy, compute_intra_cluster_similarity, compute_inter_cluster_separation,
)

router = APIRouter()


@router.get("/results/{run_id}", response_model=BenchmarkResults)
async def get_results(run_id: str):
    """Get full benchmark results."""
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    if run["status"] not in (BenchmarkStatus.completed, BenchmarkStatus.running):
        raise HTTPException(status_code=400, detail=f"Run status: {run['status']}")

    return BenchmarkResults(
        run_id=run["run_id"],
        dataset_id=run["dataset_id"],
        model_results=run.get("model_results", []),
        top_k_values=run.get("top_k_values", []),
        similarity_metric=run.get("similarity_metric", "cosine"),
    )


@router.get("/results/{run_id}/embeddings")
async def get_embedding_quality(run_id: str):
    """Get embedding quality analysis for completed run."""
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    if run["status"] != BenchmarkStatus.completed:
        raise HTTPException(status_code=400, detail="Benchmark not yet completed")

    dataset_id = run["dataset_id"]
    model_ids = run.get("model_ids", [])

    quality = {}
    for model_id in model_ids:
        cached = embedding_cache.get_doc_embeddings(model_id, dataset_id)
        if not cached:
            quality[model_id] = {"error": "embeddings not cached"}
            continue

        embeddings, doc_ids = cached
        isotropy = await asyncio.to_thread(compute_isotropy, embeddings)
        quality[model_id] = {
            "isotropy": isotropy,
            "embedding_dimension": embeddings.shape[1],
            "num_embeddings": embeddings.shape[0],
        }

    return {"run_id": run_id, "quality": quality}


@router.get("/results/{run_id}/umap")
async def get_umap_coords(run_id: str, model_id: str, n_components: int = 2):
    """Get UMAP coordinates for embedding visualization."""
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    dataset_id = run["dataset_id"]
    cached = embedding_cache.get_doc_embeddings(model_id, dataset_id)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No cached embeddings for {model_id}")

    embeddings, doc_ids = cached

    def _compute_umap():
        from umap import UMAP
        reducer = UMAP(n_components=n_components, random_state=42, n_neighbors=min(15, len(embeddings) - 1))
        coords = reducer.fit_transform(embeddings)
        return coords

    coords = await asyncio.to_thread(_compute_umap)

    points = []
    for i, doc_id in enumerate(doc_ids):
        point = {"doc_id": doc_id, "x": round(float(coords[i][0]), 4), "y": round(float(coords[i][1]), 4)}
        if n_components == 3:
            point["z"] = round(float(coords[i][2]), 4)
        points.append(point)

    return {"model_id": model_id, "points": points}


@router.post("/results/{run_id}/export")
async def export_report(run_id: str, format: str = "json"):
    """Export benchmark report as JSON or Markdown."""
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    if run["status"] != BenchmarkStatus.completed:
        raise HTTPException(status_code=400, detail="Benchmark not yet completed")

    model_results = run.get("model_results", [])
    timestamp = datetime.now(timezone.utc).isoformat()
    dataset_id = run["dataset_id"]

    report_data = {
        "run_id": run_id,
        "dataset_id": dataset_id,
        "timestamp": timestamp,
        "similarity_metric": run.get("similarity_metric", "cosine"),
        "top_k_values": run.get("top_k_values", []),
        "total_models": len(model_results),
        "elapsed_seconds": round(run.get("elapsed_seconds", 0), 1),
        "models": [],
    }

    for r in model_results:
        report_data["models"].append({
            "model_id": r.model_id,
            "ir_metrics": r.ir_metrics.model_dump(),
            "performance": r.performance.model_dump(),
        })

    if format == "markdown":
        md = _build_markdown_report(report_data)
        return PlainTextResponse(content=md, media_type="text/markdown")

    return report_data


def _build_markdown_report(data: dict) -> str:
    lines = [
        f"# Embedding Model Comparison Report",
        f"",
        f"**Run ID:** {data['run_id']}  ",
        f"**Dataset:** {data['dataset_id']}  ",
        f"**Timestamp:** {data['timestamp']}  ",
        f"**Similarity Metric:** {data['similarity_metric']}  ",
        f"**Duration:** {data['elapsed_seconds']}s  ",
        f"",
        f"## Retrieval Accuracy",
        f"",
        f"| Model | MRR | MAP | P@5 | R@5 | NDCG@10 | HR@1 |",
        f"|-------|-----|-----|-----|-----|---------|------|",
    ]
    for m in data["models"]:
        ir = m["ir_metrics"]
        lines.append(
            f"| {m['model_id']} | {ir['mrr']} | {ir['map_score']} | "
            f"{ir['precision_at_k'].get('5', ir['precision_at_k'].get(5, 0))} | "
            f"{ir['recall_at_k'].get('5', ir['recall_at_k'].get(5, 0))} | "
            f"{ir['ndcg_at_k'].get('10', ir['ndcg_at_k'].get(10, 0))} | "
            f"{ir['hit_rate_at_k'].get('1', ir['hit_rate_at_k'].get(1, 0))} |"
        )

    lines += [
        f"",
        f"## Performance & Cost",
        f"",
        f"| Model | Embed Avg (ms) | P95 (ms) | Query Avg (ms) | Throughput | Dim | Memory (MB) | Cost ($) |",
        f"|-------|---------------|----------|---------------|------------|-----|-------------|----------|",
    ]
    for m in data["models"]:
        p = m["performance"]
        lines.append(
            f"| {m['model_id']} | {p['embedding_latency_avg_ms']} | {p['embedding_latency_p95_ms']} | "
            f"{p['query_latency_avg_ms']} | {p['throughput_docs_per_sec']}/s | "
            f"{p['embedding_dimension']} | {p['memory_usage_mb']} | ${p['api_cost_usd']} |"
        )

    lines += ["", f"---", f"*Generated by Embedding Model Comparison*"]
    return "\n".join(lines)
