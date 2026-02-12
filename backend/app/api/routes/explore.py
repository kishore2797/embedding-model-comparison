"""Live query and embedding exploration routes."""

import time
import asyncio
import numpy as np
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    LiveQueryRequest, LiveQueryResponse, LiveQueryModelResult, LiveQueryHit,
    SimilarityRequest, SimilarityResponse,
)
from app.benchmark.runner import get_run
from app.benchmark.cache import embedding_cache
from app.benchmark.retrieval import build_faiss_index, search_index
from app.embeddings.registry import get_embedder

router = APIRouter()


@router.post("/explore/query", response_model=LiveQueryResponse)
async def live_query(request: LiveQueryRequest):
    """Run a live query against cached embeddings from a benchmark run."""
    run = get_run(request.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{request.run_id}' not found")

    dataset_id = run["dataset_id"]
    model_ids = run.get("model_ids", [])
    similarity_metric = run.get("similarity_metric", "cosine")

    results = []
    for model_id in model_ids:
        cached = embedding_cache.get_doc_embeddings(model_id, dataset_id)
        if not cached:
            continue

        embeddings, doc_ids = cached
        embedder = get_embedder(model_id)

        t0 = time.perf_counter()
        q_vec = await asyncio.to_thread(embedder.embed_queries, [request.query])
        latency_ms = (time.perf_counter() - t0) * 1000

        index_emb = embeddings.copy()
        index = build_faiss_index(index_emb, similarity_metric)
        hits_raw = search_index(index, q_vec, doc_ids, request.top_k, similarity_metric)

        # Get document texts from dataset
        from app.datasets.loader import get_dataset_raw
        raw_ds = get_dataset_raw(dataset_id)
        doc_text_map = {d["doc_id"]: d["text"] for d in raw_ds["documents"]} if raw_ds else {}

        hits = []
        for rank, (did, score) in enumerate(hits_raw[0]):
            hits.append(LiveQueryHit(
                doc_id=did,
                text=doc_text_map.get(did, "")[:500],
                score=round(score, 4),
                rank=rank + 1,
            ))

        results.append(LiveQueryModelResult(
            model_id=model_id,
            hits=hits,
            latency_ms=round(latency_ms, 2),
        ))

    return LiveQueryResponse(query=request.query, results=results)


@router.post("/explore/similarity", response_model=SimilarityResponse)
async def compute_similarity(request: SimilarityRequest):
    """Compare cosine similarity between two texts across all models in a run."""
    run = get_run(request.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{request.run_id}' not found")

    model_ids = run.get("model_ids", [])
    scores = {}

    for model_id in model_ids:
        try:
            embedder = get_embedder(model_id)
            vecs = await asyncio.to_thread(
                embedder.embed_documents, [request.text_a, request.text_b]
            )
            cos_sim = float(np.dot(vecs[0], vecs[1]) / (np.linalg.norm(vecs[0]) * np.linalg.norm(vecs[1]) + 1e-10))
            scores[model_id] = round(cos_sim, 4)
        except Exception:
            scores[model_id] = 0.0

    return SimilarityResponse(text_a=request.text_a, text_b=request.text_b, scores=scores)
