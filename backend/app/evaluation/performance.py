"""Performance and cost metrics tracking."""

import time
import numpy as np
from typing import List, Dict
from dataclasses import dataclass, field


@dataclass
class LatencyTracker:
    """Collects latency samples and computes percentiles."""
    samples: List[float] = field(default_factory=list)

    def record(self, duration_ms: float):
        self.samples.append(duration_ms)

    @property
    def avg(self) -> float:
        return float(np.mean(self.samples)) if self.samples else 0.0

    @property
    def p50(self) -> float:
        return float(np.percentile(self.samples, 50)) if self.samples else 0.0

    @property
    def p95(self) -> float:
        return float(np.percentile(self.samples, 95)) if self.samples else 0.0

    @property
    def p99(self) -> float:
        return float(np.percentile(self.samples, 99)) if self.samples else 0.0


def estimate_token_count(text: str) -> int:
    """Rough token estimate: ~4 chars per token."""
    return max(1, len(text) // 4)


def compute_performance_metrics(
    embedding_latencies: LatencyTracker,
    query_latencies: LatencyTracker,
    total_embedding_time_sec: float,
    num_documents: int,
    dimension: int,
    total_tokens: int,
    cost_per_1k_tokens: float,
) -> Dict:
    """Compute performance and cost metrics for a model run."""
    throughput = num_documents / total_embedding_time_sec if total_embedding_time_sec > 0 else 0
    memory_mb = (num_documents * dimension * 4) / (1024 * 1024)  # float32
    api_cost = (total_tokens / 1000) * cost_per_1k_tokens
    cost_per_1k_queries = (1000 * query_latencies.avg / 1000) * cost_per_1k_tokens if cost_per_1k_tokens > 0 else 0

    return {
        "embedding_latency_avg_ms": round(embedding_latencies.avg, 2),
        "embedding_latency_p50_ms": round(embedding_latencies.p50, 2),
        "embedding_latency_p95_ms": round(embedding_latencies.p95, 2),
        "embedding_latency_p99_ms": round(embedding_latencies.p99, 2),
        "query_latency_avg_ms": round(query_latencies.avg, 2),
        "throughput_docs_per_sec": round(throughput, 2),
        "total_embedding_time_sec": round(total_embedding_time_sec, 2),
        "embedding_dimension": dimension,
        "memory_usage_mb": round(memory_mb, 2),
        "api_cost_usd": round(api_cost, 6),
        "cost_per_1k_queries_usd": round(cost_per_1k_queries, 6),
    }
