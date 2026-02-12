"""Benchmark run/status/cancel routes."""

import uuid
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    BenchmarkRequest, BenchmarkRunResponse, BenchmarkProgress, BenchmarkStatus,
)
from app.benchmark.runner import start_benchmark, get_run, cancel_benchmark
from app.datasets.loader import get_dataset_raw

router = APIRouter()


@router.post("/benchmark/run", response_model=BenchmarkRunResponse)
async def run_benchmark(request: BenchmarkRequest):
    """Start a new benchmark run."""
    raw = get_dataset_raw(request.dataset_id)
    if not raw:
        raise HTTPException(status_code=404, detail=f"Dataset '{request.dataset_id}' not found")

    run_id = str(uuid.uuid4())[:8]

    start_benchmark(
        run_id=run_id,
        dataset_id=request.dataset_id,
        documents=raw["documents"],
        queries=raw["queries"],
        model_ids=request.model_ids,
        top_k_values=request.top_k_values,
        similarity_metric=request.similarity_metric.value,
        normalize=request.normalize_embeddings,
    )

    return BenchmarkRunResponse(
        run_id=run_id,
        status=BenchmarkStatus.running,
        message=f"Benchmark started with {len(request.model_ids)} models on {len(raw['documents'])} documents",
    )


@router.get("/benchmark/status/{run_id}", response_model=BenchmarkProgress)
async def benchmark_status(run_id: str):
    """Get benchmark progress."""
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    return BenchmarkProgress(
        run_id=run["run_id"],
        status=run["status"],
        current_model=run.get("current_model"),
        models_completed=run.get("models_completed", 0),
        total_models=run.get("total_models", 0),
        documents_embedded=run.get("documents_embedded", 0),
        total_documents=run.get("total_documents", 0),
        queries_processed=run.get("queries_processed", 0),
        total_queries=run.get("total_queries", 0),
        elapsed_seconds=round(run.get("elapsed_seconds", 0), 1),
        eta_seconds=round(run["eta_seconds"], 1) if run.get("eta_seconds") else None,
    )


@router.post("/benchmark/cancel/{run_id}")
async def cancel_run(run_id: str):
    """Cancel a running benchmark."""
    success = cancel_benchmark(run_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel — run not found or not running")
    return {"message": "Benchmark cancelled", "run_id": run_id}
