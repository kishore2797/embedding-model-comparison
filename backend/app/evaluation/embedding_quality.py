"""Embedding quality analysis — isotropy, clustering, neighbor overlap."""

import numpy as np
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity


def compute_isotropy(embeddings: np.ndarray) -> float:
    """Measure how uniformly distributed embeddings are in the space.
    Higher is better (1.0 = perfectly isotropic)."""
    if len(embeddings) < 2:
        return 0.0
    centered = embeddings - embeddings.mean(axis=0)
    _, s, _ = np.linalg.svd(centered, full_matrices=False)
    s = s / s.sum()
    entropy = -np.sum(s * np.log(s + 1e-10))
    max_entropy = np.log(len(s))
    return round(float(entropy / max_entropy) if max_entropy > 0 else 0.0, 4)


def compute_intra_cluster_similarity(
    embeddings: np.ndarray,
    doc_ids: List[str],
    relevant_sets: List[set],
) -> float:
    """Average cosine similarity between relevant document pairs."""
    sims = []
    id_to_idx = {d: i for i, d in enumerate(doc_ids)}
    for rel_set in relevant_sets:
        ids_in_set = [d for d in rel_set if d in id_to_idx]
        if len(ids_in_set) < 2:
            continue
        idxs = [id_to_idx[d] for d in ids_in_set]
        vecs = embeddings[idxs]
        sim_matrix = cosine_similarity(vecs)
        n = len(idxs)
        for i in range(n):
            for j in range(i + 1, n):
                sims.append(sim_matrix[i][j])
    return round(float(np.mean(sims)) if sims else 0.0, 4)


def compute_inter_cluster_separation(
    embeddings: np.ndarray,
    doc_ids: List[str],
    relevant_sets: List[set],
) -> float:
    """Average distance between relevant and non-relevant docs per query."""
    separations = []
    id_to_idx = {d: i for i, d in enumerate(doc_ids)}
    all_ids = set(doc_ids)

    for rel_set in relevant_sets:
        rel_ids = [d for d in rel_set if d in id_to_idx]
        non_rel_ids = [d for d in (all_ids - rel_set) if d in id_to_idx]
        if not rel_ids or not non_rel_ids:
            continue
        rel_vecs = embeddings[[id_to_idx[d] for d in rel_ids]]
        non_rel_vecs = embeddings[[id_to_idx[d] for d in non_rel_ids[:50]]]  # cap for speed
        cross_sim = cosine_similarity(rel_vecs, non_rel_vecs)
        separations.append(1.0 - float(np.mean(cross_sim)))

    return round(float(np.mean(separations)) if separations else 0.0, 4)


def compute_nearest_neighbor_overlap(
    embeddings_a: np.ndarray,
    embeddings_b: np.ndarray,
    k: int = 10,
) -> float:
    """Fraction of shared k-nearest neighbors between two embedding spaces."""
    n = len(embeddings_a)
    if n < k + 1:
        k = max(1, n - 1)

    sim_a = cosine_similarity(embeddings_a)
    sim_b = cosine_similarity(embeddings_b)

    overlaps = []
    for i in range(n):
        nn_a = set(np.argsort(sim_a[i])[-k - 1:-1])
        nn_b = set(np.argsort(sim_b[i])[-k - 1:-1])
        overlaps.append(len(nn_a & nn_b) / k)

    return round(float(np.mean(overlaps)), 4)
