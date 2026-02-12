"""Information Retrieval metrics: Precision, Recall, MRR, NDCG, MAP, Hit Rate."""

import math
from typing import List, Dict


def precision_at_k(retrieved: List[str], relevant: set, k: int) -> float:
    """Fraction of top-k retrieved docs that are relevant."""
    top_k = retrieved[:k]
    if not top_k:
        return 0.0
    return sum(1 for d in top_k if d in relevant) / len(top_k)


def recall_at_k(retrieved: List[str], relevant: set, k: int) -> float:
    """Fraction of relevant docs found in top-k."""
    if not relevant:
        return 0.0
    top_k = retrieved[:k]
    return sum(1 for d in top_k if d in relevant) / len(relevant)


def reciprocal_rank(retrieved: List[str], relevant: set) -> float:
    """1 / rank of the first relevant document."""
    for i, doc_id in enumerate(retrieved):
        if doc_id in relevant:
            return 1.0 / (i + 1)
    return 0.0


def ndcg_at_k(retrieved: List[str], relevance_grades: Dict[str, int], k: int) -> float:
    """Normalized Discounted Cumulative Gain at k."""
    def dcg(scores: List[float]) -> float:
        return sum(s / math.log2(i + 2) for i, s in enumerate(scores))

    top_k = retrieved[:k]
    gains = [relevance_grades.get(d, 0) for d in top_k]
    actual_dcg = dcg(gains)

    ideal_gains = sorted(relevance_grades.values(), reverse=True)[:k]
    ideal_dcg = dcg(ideal_gains)

    if ideal_dcg == 0:
        return 0.0
    return actual_dcg / ideal_dcg


def average_precision(retrieved: List[str], relevant: set) -> float:
    """Average precision for a single query."""
    if not relevant:
        return 0.0
    hits = 0
    sum_precision = 0.0
    for i, doc_id in enumerate(retrieved):
        if doc_id in relevant:
            hits += 1
            sum_precision += hits / (i + 1)
    return sum_precision / len(relevant)


def hit_rate_at_k(retrieved: List[str], relevant: set, k: int) -> float:
    """1 if at least one relevant doc in top-k, else 0."""
    top_k = retrieved[:k]
    return 1.0 if any(d in relevant for d in top_k) else 0.0


def compute_all_metrics(
    all_retrieved: List[List[str]],
    all_relevant: List[set],
    all_relevance_grades: List[Dict[str, int]],
    top_k_values: List[int],
) -> Dict:
    """Compute all IR metrics averaged across queries."""
    n = len(all_retrieved)
    if n == 0:
        return {
            "precision_at_k": {k: 0.0 for k in top_k_values},
            "recall_at_k": {k: 0.0 for k in top_k_values},
            "mrr": 0.0,
            "ndcg_at_k": {k: 0.0 for k in top_k_values},
            "map_score": 0.0,
            "hit_rate_at_k": {k: 0.0 for k in top_k_values},
        }

    prec = {k: sum(precision_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)) / n for k in top_k_values}
    rec = {k: sum(recall_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)) / n for k in top_k_values}
    mrr_val = sum(reciprocal_rank(r, rel) for r, rel in zip(all_retrieved, all_relevant)) / n
    ndcg = {k: sum(ndcg_at_k(r, g, k) for r, g in zip(all_retrieved, all_relevance_grades)) / n for k in top_k_values}
    map_val = sum(average_precision(r, rel) for r, rel in zip(all_retrieved, all_relevant)) / n
    hr = {k: sum(hit_rate_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)) / n for k in top_k_values}

    return {
        "precision_at_k": {k: round(v, 4) for k, v in prec.items()},
        "recall_at_k": {k: round(v, 4) for k, v in rec.items()},
        "mrr": round(mrr_val, 4),
        "ndcg_at_k": {k: round(v, 4) for k, v in ndcg.items()},
        "map_score": round(map_val, 4),
        "hit_rate_at_k": {k: round(v, 4) for k, v in hr.items()},
    }
