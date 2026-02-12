"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


# ── Enums ───────────────────────────────────────────────────────────────────

class SimilarityMetric(str, Enum):
    cosine = "cosine"
    dot_product = "dot_product"
    euclidean = "euclidean"


class ModelStatus(str, Enum):
    ready = "ready"
    loading = "loading"
    error = "error"
    api_key_missing = "api_key_missing"


class BenchmarkStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"


# ── Dataset schemas ─────────────────────────────────────────────────────────

class RelevanceJudgment(BaseModel):
    query: str
    relevant_doc_ids: List[str]
    relevance_grades: Optional[Dict[str, int]] = None  # doc_id -> grade (0-3)


class DatasetDocument(BaseModel):
    doc_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None


class DatasetInfo(BaseModel):
    id: str
    name: str
    description: str
    document_count: int
    query_count: int
    avg_doc_length: float
    category: str
    is_builtin: bool = True


class DatasetFull(DatasetInfo):
    documents: List[DatasetDocument]
    queries: List[RelevanceJudgment]


# ── Model schemas ───────────────────────────────────────────────────────────

class ModelInfo(BaseModel):
    id: str
    provider: str
    model_name: str
    dimension: int
    max_tokens: int
    cost_per_1k_tokens: float
    description: str
    query_prefix: str = ""
    document_prefix: str = ""
    status: ModelStatus = ModelStatus.ready


class ValidateModelsRequest(BaseModel):
    model_ids: List[str]


class ValidateModelsResponse(BaseModel):
    results: Dict[str, ModelStatus]


# ── Benchmark schemas ───────────────────────────────────────────────────────

class BenchmarkRequest(BaseModel):
    dataset_id: str
    model_ids: List[str] = Field(..., min_length=1, max_length=6)
    top_k_values: List[int] = Field(default=[1, 3, 5, 10, 20])
    similarity_metric: SimilarityMetric = SimilarityMetric.cosine
    normalize_embeddings: bool = True


class BenchmarkProgress(BaseModel):
    run_id: str
    status: BenchmarkStatus
    current_model: Optional[str] = None
    models_completed: int = 0
    total_models: int = 0
    documents_embedded: int = 0
    total_documents: int = 0
    queries_processed: int = 0
    total_queries: int = 0
    elapsed_seconds: float = 0
    eta_seconds: Optional[float] = None


class BenchmarkRunResponse(BaseModel):
    run_id: str
    status: BenchmarkStatus
    message: str


# ── Metrics schemas ─────────────────────────────────────────────────────────

class IRMetrics(BaseModel):
    precision_at_k: Dict[int, float]   # k -> value
    recall_at_k: Dict[int, float]
    mrr: float
    ndcg_at_k: Dict[int, float]
    map_score: float
    hit_rate_at_k: Dict[int, float]


class PerformanceMetrics(BaseModel):
    embedding_latency_avg_ms: float
    embedding_latency_p50_ms: float
    embedding_latency_p95_ms: float
    embedding_latency_p99_ms: float
    query_latency_avg_ms: float
    throughput_docs_per_sec: float
    total_embedding_time_sec: float
    embedding_dimension: int
    memory_usage_mb: float
    api_cost_usd: float
    cost_per_1k_queries_usd: float


class ModelBenchmarkResult(BaseModel):
    model_id: str
    ir_metrics: IRMetrics
    performance: PerformanceMetrics
    per_query_results: Optional[List[Dict[str, Any]]] = None


class BenchmarkResults(BaseModel):
    run_id: str
    dataset_id: str
    model_results: List[ModelBenchmarkResult]
    top_k_values: List[int]
    similarity_metric: str


# ── Explore schemas ─────────────────────────────────────────────────────────

class LiveQueryRequest(BaseModel):
    run_id: str
    query: str
    top_k: int = Field(default=5, ge=1, le=20)


class LiveQueryHit(BaseModel):
    doc_id: str
    text: str
    score: float
    rank: int


class LiveQueryModelResult(BaseModel):
    model_id: str
    hits: List[LiveQueryHit]
    latency_ms: float


class LiveQueryResponse(BaseModel):
    query: str
    results: List[LiveQueryModelResult]


class SimilarityRequest(BaseModel):
    run_id: str
    text_a: str
    text_b: str


class SimilarityResponse(BaseModel):
    text_a: str
    text_b: str
    scores: Dict[str, float]  # model_id -> cosine similarity


# ── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    available_models: int
    openai_configured: bool
    cohere_configured: bool
    local_models_available: bool
