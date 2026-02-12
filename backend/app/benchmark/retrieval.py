"""Vector search retrieval using FAISS."""

import numpy as np
import faiss
from typing import List, Tuple


def build_faiss_index(embeddings: np.ndarray, metric: str = "cosine") -> faiss.Index:
    """Build a FAISS index from embeddings."""
    dim = embeddings.shape[1]
    if metric == "cosine":
        faiss.normalize_L2(embeddings)
        index = faiss.IndexFlatIP(dim)
    elif metric == "dot_product":
        index = faiss.IndexFlatIP(dim)
    else:  # euclidean
        index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    return index


def search_index(
    index: faiss.Index,
    query_embeddings: np.ndarray,
    doc_ids: List[str],
    top_k: int,
    metric: str = "cosine",
) -> List[List[Tuple[str, float]]]:
    """Search the FAISS index and return (doc_id, score) pairs per query."""
    if metric == "cosine":
        faiss.normalize_L2(query_embeddings)

    k = min(top_k, index.ntotal)
    distances, indices = index.search(query_embeddings, k)

    results = []
    for i in range(len(query_embeddings)):
        hits = []
        for j in range(k):
            idx = int(indices[i][j])
            if idx < 0:
                continue
            score = float(distances[i][j])
            if metric == "euclidean":
                score = 1.0 / (1.0 + score)  # convert distance to similarity
            hits.append((doc_ids[idx], score))
        results.append(hits)
    return results
