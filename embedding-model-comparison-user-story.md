# Embedding Model Comparison — User Story

## Project Overview

A full-stack application that benchmarks embedding models (OpenAI, Cohere, and open-source models like all-MiniLM, E5, BGE) on the same dataset, measuring retrieval accuracy, latency, cost, and embedding quality to help developers choose the right model for their RAG pipeline.

---

## User Personas

### Primary: RAG Developer (Alex)
Alex is building a retrieval-augmented generation pipeline and needs to decide which embedding model to use. They want hard data — not blog opinions — on how each model performs on their specific type of content, with clear metrics around accuracy, speed, and cost.

### Secondary: ML Engineer (Priya)
Priya evaluates embedding models for her team's search infrastructure. She needs to compare open-source vs. commercial models across multiple dimensions and produce reports that justify the choice to stakeholders.

### Tertiary: Technical Lead (Jordan)
Jordan needs a quick way to sanity-check whether switching from one embedding provider to another would improve retrieval quality without blowing up the budget.

---

## Epics

### Epic 1: Dataset Management
### Epic 2: Embedding Model Integration
### Epic 3: Retrieval Benchmark Engine
### Epic 4: Metrics & Evaluation
### Epic 5: Visualization & Reporting
### Epic 6: Interactive Exploration

---

## User Stories

### Epic 1: Dataset Management

#### US-1.1: Load Evaluation Dataset
**As** Alex, **I want to** load a dataset of documents with ground-truth query-document pairs, **so that** I can benchmark retrieval accuracy consistently across models.

**Acceptance Criteria:**
- Upload a JSON/CSV file with fields: `query`, `relevant_doc_ids`, `documents`
- System validates the dataset structure and reports errors
- 3 built-in benchmark datasets are available:
  - **NQ-Subset**: 200 Natural Questions pairs (general knowledge)
  - **TechQA**: 150 technical documentation Q&A pairs
  - **Legal-QA**: 100 legal document retrieval pairs
- Display dataset stats: document count, avg document length, query count, vocabulary size
- Max dataset size: 1,000 documents, 500 queries

#### US-1.2: Custom Dataset Builder
**As** Priya, **I want to** create a custom evaluation dataset from my own documents, **so that** I can benchmark on domain-specific content.

**Acceptance Criteria:**
- Paste or upload documents (txt, md, pdf)
- Add query-document relevance pairs manually or via CSV
- Support relevance grades: `highly_relevant` (3), `relevant` (2), `marginally_relevant` (1), `not_relevant` (0)
- Export dataset as JSON for reuse
- Validate that every query has at least one relevant document

---

### Epic 2: Embedding Model Integration

#### US-2.1: Configure Embedding Models
**As** Alex, **I want to** select which embedding models to benchmark, **so that** I can compare the ones relevant to my use case.

**Acceptance Criteria:**
- Available models:
  - **OpenAI**: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`
  - **Cohere**: `embed-english-v3.0`, `embed-english-light-v3.0`, `embed-multilingual-v3.0`
  - **Open-Source (local)**:
    - `sentence-transformers/all-MiniLM-L6-v2` (384d)
    - `intfloat/e5-small-v2` (384d), `intfloat/e5-base-v2` (768d), `intfloat/e5-large-v2` (1024d)
    - `BAAI/bge-small-en-v1.5` (384d), `BAAI/bge-base-en-v1.5` (768d), `BAAI/bge-large-en-v1.5` (1024d)
- Select 2–6 models per benchmark run
- Display model metadata: dimension, max tokens, parameter count, provider, cost per 1K tokens
- API keys for OpenAI and Cohere are configurable via environment variables or UI input
- Open-source models are downloaded and run locally

#### US-2.2: Model Warm-Up & Validation
**As** Alex, **I want** the system to validate that each selected model is accessible and working before starting a benchmark, **so that** I don't waste time on failed runs.

**Acceptance Criteria:**
- Ping each API-based model with a test embedding request
- Verify local models can be loaded (check disk space, VRAM if GPU)
- Report model status: `ready`, `loading`, `error`, `api_key_missing`
- Display estimated benchmark duration based on dataset size and model count
- Show estimated API cost for commercial models before starting

---

### Epic 3: Retrieval Benchmark Engine

#### US-3.1: Run Embedding Benchmark
**As** Alex, **I want to** embed all documents with each selected model and run retrieval queries, **so that** I can compare their performance.

**Acceptance Criteria:**
- For each model:
  1. Embed all documents in the dataset
  2. Store embeddings in an in-memory vector index (FAISS or ChromaDB)
  3. Embed each query
  4. Retrieve top-k documents (k = 1, 3, 5, 10, 20)
  5. Compare retrieved docs against ground-truth relevance labels
- Show real-time progress: model name, documents embedded, queries processed, ETA
- Support cancellation mid-run
- Cache embeddings to avoid re-computing on parameter changes
- Handle rate limits for API-based models with exponential backoff

#### US-3.2: Retrieval Configuration
**As** Priya, **I want to** configure retrieval parameters, **so that** I can test different search settings.

**Acceptance Criteria:**
- Configurable parameters:
  - **Top-K values**: default [1, 3, 5, 10, 20]
  - **Similarity metric**: cosine (default), dot product, euclidean
  - **Query prefix**: optional prefix for models that require it (e.g., E5 uses `"query: "`)
  - **Document prefix**: optional prefix (e.g., E5 uses `"passage: "`)
  - **Normalization**: L2-normalize embeddings before search (on/off)
- Presets for known model requirements (E5 prefixes, BGE instruction prefix)
- Re-run retrieval with different settings without re-embedding

---

### Epic 4: Metrics & Evaluation

#### US-4.1: Retrieval Accuracy Metrics
**As** Alex, **I want to** see standard IR metrics for each model, **so that** I can objectively compare retrieval quality.

**Acceptance Criteria:**
- Compute per-model metrics:
  - **Precision@K** (K = 1, 3, 5, 10, 20)
  - **Recall@K** (K = 1, 3, 5, 10, 20)
  - **MRR (Mean Reciprocal Rank)**
  - **NDCG@K (Normalized Discounted Cumulative Gain)** (K = 5, 10, 20)
  - **MAP (Mean Average Precision)**
  - **Hit Rate@K** (at least one relevant doc in top-K)
- Display metrics in a sortable comparison table
- Highlight the best-performing model for each metric
- Show per-query breakdown (which queries each model got right/wrong)
- Export metrics as CSV/JSON

#### US-4.2: Performance & Cost Metrics
**As** Jordan, **I want to** see latency and cost data alongside accuracy, **so that** I can make a balanced decision.

**Acceptance Criteria:**
- Measure per-model:
  - **Embedding latency**: avg, p50, p95, p99 (ms per document)
  - **Query latency**: avg, p50, p95 (ms per query)
  - **Throughput**: documents/second
  - **Total embedding time**: wall clock for full dataset
  - **Embedding dimension**: actual output dimension
  - **Memory usage**: approximate RAM for storing all embeddings
  - **API cost**: total cost for embedding the dataset (commercial models)
  - **Cost per 1K queries**: estimated ongoing cost
- Compute a composite **value score**: accuracy / (normalized_cost + normalized_latency)
- Show cost-accuracy Pareto frontier

#### US-4.3: Embedding Quality Analysis
**As** Priya, **I want to** analyze the embedding space quality beyond retrieval metrics, **so that** I understand how each model represents the data.

**Acceptance Criteria:**
- Compute per-model:
  - **Intra-cluster similarity**: avg cosine similarity between relevant doc pairs
  - **Inter-cluster separation**: avg distance between relevant and non-relevant docs for each query
  - **Embedding isotropy**: how uniformly distributed embeddings are in the space
  - **Nearest-neighbor overlap**: % of shared nearest neighbors between models
- Visualize embedding spaces with dimensionality reduction (UMAP/t-SNE)
- Color points by: document cluster, relevance to a selected query, model source

---

### Epic 5: Visualization & Reporting

#### US-5.1: Comparison Dashboard
**As** Alex, **I want** a visual dashboard comparing all models at a glance, **so that** I can quickly identify the best option.

**Acceptance Criteria:**
- **Radar chart**: overlay models on axes (Precision@5, Recall@10, MRR, Latency, Cost)
- **Bar charts**: grouped bars for each metric across models
- **Heatmap**: models × metrics matrix with color-coded performance
- **Scatter plot**: accuracy vs. latency, accuracy vs. cost, accuracy vs. dimension
- **Ranking table**: overall rank based on weighted metric combination (user-configurable weights)
- All charts are interactive (hover for details, click to filter)

#### US-5.2: Per-Query Analysis
**As** Priya, **I want to** drill into individual queries to see where models disagree, **so that** I can understand failure modes.

**Acceptance Criteria:**
- Select a query and see each model's top-5 retrieved documents side by side
- Highlight documents that are in ground truth but missed by a model
- Show similarity scores for each retrieved document
- Filter queries by: "all models correct", "all models wrong", "models disagree"
- Display query difficulty score (% of models that retrieved relevant docs)

#### US-5.3: Export Report
**As** Jordan, **I want to** export a benchmark report, **so that** I can share findings with my team.

**Acceptance Criteria:**
- Export as JSON (full data) or Markdown (formatted report)
- Report includes: dataset summary, model configurations, all metrics, top findings
- Include chart screenshots or SVG exports
- Timestamp and reproducibility info (model versions, dataset hash)

---

### Epic 6: Interactive Exploration

#### US-6.1: Live Query Testing
**As** Alex, **I want to** type a custom query and see how each model retrieves documents in real time, **so that** I can interactively explore model behavior.

**Acceptance Criteria:**
- Text input for ad-hoc queries (outside the benchmark dataset)
- Show top-5 results per model side by side with similarity scores
- Highlight text overlap between query and retrieved documents
- Response time displayed per model
- Works after embeddings are cached from a benchmark run

#### US-6.2: Embedding Inspector
**As** Priya, **I want to** inspect individual embeddings, **so that** I can debug unexpected retrieval behavior.

**Acceptance Criteria:**
- Select any document or query and view its embedding vector (truncated display)
- Compare cosine similarity between any two texts across all models
- Show which dimensions contribute most to similarity (top-10 dimensions)
- Display embedding norm and sparsity statistics

---

## Technical Requirements

### Backend (Python / FastAPI)

```
Project Structure:
backend/
├── app/
│   ├── main.py                    # FastAPI app with CORS
│   ├── config.py                  # Settings, API keys, model registry
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response models
│   ├── embeddings/
│   │   ├── base.py                # Abstract embedder interface
│   │   ├── openai_embedder.py     # OpenAI embedding wrapper
│   │   ├── cohere_embedder.py     # Cohere embedding wrapper
│   │   ├── local_embedder.py      # sentence-transformers wrapper (MiniLM, E5, BGE)
│   │   └── registry.py            # Model registry and factory
│   ├── benchmark/
│   │   ├── runner.py              # Orchestrates benchmark execution
│   │   ├── retrieval.py           # Vector search + retrieval logic
│   │   └── cache.py               # Embedding cache management
│   ├── evaluation/
│   │   ├── ir_metrics.py          # Precision, Recall, MRR, NDCG, MAP
│   │   ├── performance.py         # Latency, throughput, cost tracking
│   │   └── embedding_quality.py   # Isotropy, clustering, overlap analysis
│   ├── datasets/
│   │   ├── loader.py              # Dataset loading and validation
│   │   ├── builder.py             # Custom dataset creation
│   │   └── builtin/               # Built-in benchmark datasets (JSON)
│   │       ├── nq_subset.json
│   │       ├── techqa.json
│   │       └── legal_qa.json
│   └── api/
│       └── routes/
│           ├── benchmark.py       # Run/status/cancel benchmark
│           ├── models.py          # List/validate models
│           ├── datasets.py        # Dataset CRUD
│           ├── results.py         # Metrics and analysis endpoints
│           └── explore.py         # Live query, embedding inspector
└── requirements.txt
```

**Key Dependencies:**
- `fastapi`, `uvicorn`, `pydantic`
- `openai` (for OpenAI embeddings)
- `cohere` (for Cohere embeddings)
- `sentence-transformers` (for local models)
- `faiss-cpu` (vector similarity search)
- `numpy`, `scikit-learn` (metrics, UMAP)
- `umap-learn` (dimensionality reduction)

### Frontend (React / Vite / Tailwind)

```
frontend/
├── src/
│   ├── api/client.js              # API client
│   ├── components/
│   │   ├── DatasetManager.jsx     # Upload, select, preview datasets
│   │   ├── ModelSelector.jsx      # Pick models, show metadata, validate
│   │   ├── BenchmarkRunner.jsx    # Start/monitor/cancel benchmark
│   │   ├── MetricsTable.jsx       # Sortable comparison table
│   │   ├── RadarChart.jsx         # Multi-model radar overlay
│   │   ├── ScatterPlot.jsx        # Accuracy vs. cost/latency
│   │   ├── HeatmapChart.jsx       # Models × metrics heatmap
│   │   ├── EmbeddingViz.jsx       # UMAP/t-SNE scatter with controls
│   │   ├── QueryExplorer.jsx      # Live query + per-query drill-down
│   │   ├── EmbeddingInspector.jsx # Vector inspection tool
│   │   ├── RankingTable.jsx       # Weighted overall ranking
│   │   └── ExportReport.jsx       # Export controls
│   ├── App.jsx
│   └── main.jsx
```

**Key Dependencies:**
- `react`, `vite`, `tailwindcss`
- `recharts` (charts: bar, radar, scatter, heatmap)
- `axios` (API calls)
- `lucide-react` (icons)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | List available embedding models with metadata |
| POST | `/api/models/validate` | Check model accessibility (API keys, local availability) |
| GET | `/api/datasets` | List available datasets (built-in + uploaded) |
| POST | `/api/datasets/upload` | Upload custom dataset |
| POST | `/api/datasets/build` | Create dataset from documents + queries |
| GET | `/api/datasets/:id` | Get dataset details and stats |
| POST | `/api/benchmark/run` | Start a benchmark run |
| GET | `/api/benchmark/status/:id` | Get benchmark progress |
| POST | `/api/benchmark/cancel/:id` | Cancel a running benchmark |
| GET | `/api/results/:run_id` | Get full benchmark results |
| GET | `/api/results/:run_id/metrics` | Get computed IR metrics |
| GET | `/api/results/:run_id/performance` | Get latency/cost metrics |
| GET | `/api/results/:run_id/embeddings` | Get embedding quality analysis |
| GET | `/api/results/:run_id/umap` | Get UMAP coordinates for visualization |
| POST | `/api/explore/query` | Live query against cached embeddings |
| POST | `/api/explore/similarity` | Compare two texts across models |
| POST | `/api/results/:run_id/export` | Export report (JSON/Markdown) |
| GET | `/api/health` | Health check |

---

## Non-Functional Requirements

### Performance
- Benchmark 500 documents × 5 models should complete in < 10 minutes (local models)
- API-based models should respect rate limits and retry gracefully
- Embedding cache should persist across page reloads (server-side)
- Frontend should remain responsive during long benchmark runs (progress polling)
- UMAP visualization should handle up to 5,000 points smoothly

### Security
- API keys are never sent to the frontend or logged
- API keys are stored in environment variables or encrypted in-memory
- No embedding data is sent to external services beyond the embedding API calls

### Usability
- Clear progress indicators with ETA during benchmark runs
- Estimated cost warning before running commercial model benchmarks
- Sensible defaults: top 3 open-source models pre-selected for quick start
- Tooltips explaining each metric (MRR, NDCG, etc.)
- Mobile-responsive dashboard layout

### Data Integrity
- Dataset validation prevents malformed inputs
- Embedding dimensions are verified to match expected model output
- Results include reproducibility metadata (model versions, timestamps, dataset hash)

---

## Definition of Done

- [ ] 3 built-in benchmark datasets with ground-truth relevance labels
- [ ] At least 8 embedding models integrated (3 OpenAI, 3 Cohere, 2+ open-source families)
- [ ] Full IR metrics suite: Precision@K, Recall@K, MRR, NDCG@K, MAP, Hit Rate@K
- [ ] Performance metrics: latency percentiles, throughput, cost estimation
- [ ] Embedding quality analysis: isotropy, clustering, neighbor overlap
- [ ] Interactive dashboard with radar chart, heatmap, scatter plots, ranking table
- [ ] Per-query drill-down showing model agreement/disagreement
- [ ] UMAP/t-SNE embedding space visualization
- [ ] Live query explorer against cached embeddings
- [ ] Export benchmark report as JSON and Markdown
- [ ] API key validation and cost estimation before benchmark runs
- [ ] Embedding cache to avoid redundant computation
- [ ] Benchmark progress tracking with cancellation support
- [ ] All API endpoints documented via FastAPI /docs
- [ ] README with setup instructions and usage guide
