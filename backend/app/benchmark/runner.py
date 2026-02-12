"""Benchmark runner — orchestrates embedding, retrieval, and evaluation."""

import uuid
import time
import numpy as np
from typing import Dict, List, Optional
from threading import Thread

from app.models.schemas import (
    BenchmarkStatus, BenchmarkProgress, ModelBenchmarkResult,
    IRMetrics, PerformanceMetrics, BenchmarkResults,
)
from app.embeddings.registry import get_embedder
from app.benchmark.cache import embedding_cache
from app.benchmark.retrieval import build_faiss_index, search_index
from app.evaluation.ir_metrics import compute_all_metrics
from app.evaluation.performance import LatencyTracker, compute_performance_metrics, estimate_token_count
from app.config import MODEL_REGISTRY


# In-memory store for benchmark runs
_runs: Dict[str, dict] = {}


def get_run(run_id: str) -> Optional[dict]:
    return _runs.get(run_id)


def list_runs() -> List[dict]:
    return list(_runs.values())


def start_benchmark(
    run_id: str,
    dataset_id: str,
    documents: list,
    queries: list,
    model_ids: List[str],
    top_k_values: List[int],
    similarity_metric: str,
    normalize: bool,
):
    """Initialize and start a benchmark run in a background thread."""
    _runs[run_id] = {
        "run_id": run_id,
        "dataset_id": dataset_id,
        "status": BenchmarkStatus.running,
        "current_model": None,
        "models_completed": 0,
        "total_models": len(model_ids),
        "documents_embedded": 0,
        "total_documents": len(documents),
        "queries_processed": 0,
        "total_queries": len(queries),
        "elapsed_seconds": 0,
        "eta_seconds": None,
        "model_results": [],
        "model_ids": model_ids,
        "top_k_values": top_k_values,
        "similarity_metric": similarity_metric,
        "cancelled": False,
    }

    thread = Thread(
        target=_run_benchmark,
        args=(run_id, dataset_id, documents, queries, model_ids, top_k_values, similarity_metric, normalize),
        daemon=True,
    )
    thread.start()


def cancel_benchmark(run_id: str) -> bool:
    run = _runs.get(run_id)
    if not run or run["status"] != BenchmarkStatus.running:
        return False
    run["cancelled"] = True
    run["status"] = BenchmarkStatus.cancelled
    return True


def _run_benchmark(
    run_id: str,
    dataset_id: str,
    documents: list,
    queries: list,
    model_ids: List[str],
    top_k_values: List[int],
    similarity_metric: str,
    normalize: bool,
):
    """Background worker that runs the full benchmark."""
    run = _runs[run_id]
    start_time = time.time()
    doc_texts = [d["text"] for d in documents]
    doc_ids = [d["doc_id"] for d in documents]
    max_k = max(top_k_values)

    try:
        for model_idx, model_id in enumerate(model_ids):
            if run.get("cancelled"):
                return

            run["current_model"] = model_id
            embedder = get_embedder(model_id)
            model_entry = MODEL_REGISTRY.get(model_id, {})
            embed_latency = LatencyTracker()
            query_latency = LatencyTracker()

            # ── Embed documents ──────────────────────────────────────────
            cached = embedding_cache.get_doc_embeddings(model_id, dataset_id)
            if cached:
                doc_embeddings, cached_ids = cached
            else:
                batch_size = 32
                all_vecs = []
                for i in range(0, len(doc_texts), batch_size):
                    if run.get("cancelled"):
                        return
                    batch = doc_texts[i:i + batch_size]
                    t0 = time.perf_counter()
                    vecs = embedder.embed_documents(batch)
                    elapsed_ms = (time.perf_counter() - t0) * 1000
                    for _ in batch:
                        embed_latency.record(elapsed_ms / len(batch))
                    all_vecs.append(vecs)
                    run["documents_embedded"] = min(i + batch_size, len(doc_texts))

                doc_embeddings = np.vstack(all_vecs)
                if normalize:
                    norms = np.linalg.norm(doc_embeddings, axis=1, keepdims=True)
                    doc_embeddings = doc_embeddings / np.maximum(norms, 1e-10)
                embedding_cache.set_doc_embeddings(model_id, dataset_id, doc_embeddings.copy(), doc_ids)

            total_embed_time = sum(embed_latency.samples) / 1000 if embed_latency.samples else 0.01

            # ── Build FAISS index ────────────────────────────────────────
            index_embeddings = doc_embeddings.copy()
            index = build_faiss_index(index_embeddings, similarity_metric)

            # ── Run queries ──────────────────────────────────────────────
            all_retrieved = []
            per_query_results = []

            for qi, q in enumerate(queries):
                if run.get("cancelled"):
                    return

                t0 = time.perf_counter()
                q_vec = embedder.embed_queries([q["query"]])
                if normalize:
                    norms = np.linalg.norm(q_vec, axis=1, keepdims=True)
                    q_vec = q_vec / np.maximum(norms, 1e-10)
                query_latency.record((time.perf_counter() - t0) * 1000)

                hits = search_index(index, q_vec, doc_ids, max_k, similarity_metric)
                retrieved_ids = [h[0] for h in hits[0]]
                all_retrieved.append(retrieved_ids)

                per_query_results.append({
                    "query": q["query"],
                    "retrieved": [{"doc_id": h[0], "score": round(h[1], 4)} for h in hits[0][:10]],
                    "relevant": q["relevant_doc_ids"],
                })
                run["queries_processed"] = qi + 1

            # ── Compute metrics ──────────────────────────────────────────
            all_relevant = [set(q["relevant_doc_ids"]) for q in queries]
            all_grades = []
            for q in queries:
                grades = q.get("relevance_grades") or {}
                if not grades:
                    grades = {d: 3 for d in q["relevant_doc_ids"]}
                all_grades.append(grades)

            ir = compute_all_metrics(all_retrieved, all_relevant, all_grades, top_k_values)

            total_tokens = sum(estimate_token_count(t) for t in doc_texts)
            perf = compute_performance_metrics(
                embed_latency, query_latency, total_embed_time,
                len(doc_texts), model_entry.get("dimension", 384),
                total_tokens, model_entry.get("cost_per_1k_tokens", 0),
            )

            run["model_results"].append(ModelBenchmarkResult(
                model_id=model_id,
                ir_metrics=IRMetrics(**ir),
                performance=PerformanceMetrics(**perf),
                per_query_results=per_query_results,
            ))

            run["models_completed"] = model_idx + 1
            run["documents_embedded"] = 0
            run["queries_processed"] = 0
            run["elapsed_seconds"] = time.time() - start_time

            if model_idx < len(model_ids) - 1:
                remaining_models = len(model_ids) - model_idx - 1
                avg_time = run["elapsed_seconds"] / (model_idx + 1)
                run["eta_seconds"] = avg_time * remaining_models

        run["status"] = BenchmarkStatus.completed
        run["elapsed_seconds"] = time.time() - start_time
        run["eta_seconds"] = 0
        run["current_model"] = None

    except Exception as e:
        run["status"] = BenchmarkStatus.failed
        run["error"] = str(e)
