# 🔬 Embedding Model Comparison

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FAISS-1.7+-blue?style=flat-square" />
</p>

> **Benchmark 11+ embedding models** — OpenAI, Cohere, and open-source (MiniLM, E5, BGE) on the same dataset. Compare retrieval accuracy, latency, cost, and embedding quality in one dashboard.

Part of the [Mastering RAG](https://github.com/kishore2797/mastering-rag) ecosystem → tutorial: [rag-03-embedding-models](https://github.com/kishore2797/rag-03-embedding-models).

---

## 🌍 Real-World Scenario

> You're building a product search engine. Users type "lightweight laptop for programming under $800" and expect relevant results. The **embedding model** decides that "lightweight laptop" is close to "ultrabook" and "MacBook Air." Pick the wrong model and search returns desktops; pick an expensive one and you burn budget on a simple demo. This app lets you compare 11+ models on the same data and choose wisely.

---

## 🏗️ What You'll Build

A benchmarking dashboard that compares **11+ embedding models** (OpenAI, Cohere, open-source) on the same datasets. Measure retrieval accuracy (Precision@K, MRR, NDCG), latency, cost, and embedding quality — with UMAP visualization and exportable reports.

```
Dataset (queries + ground truth) ──→ 11 Models in parallel
  ├── OpenAI text-embedding-3 (small, large, ada)
  ├── Cohere embed-v3 (english, multilingual, light)
  └── Open-source: MiniLM, E5, BGE-large
──→ Compare: Precision@K, MRR, NDCG, latency, cost, UMAP viz
```

## 🔑 Key Concepts

- **Embeddings** — Dense vectors that capture semantic meaning
- **Dimension trade-offs** — 384 vs. 768 vs. 1536 (speed vs. quality)
- **IR metrics** — Precision@K, Recall@K, MRR, NDCG, MAP, Hit Rate
- **Asymmetric embeddings** — Query and document can use different encoding strategies
- **Isotropy** — How uniformly embeddings are distributed in vector space

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+ · FastAPI · sentence-transformers · FAISS · NumPy · scikit-learn |
| Frontend | React 19 · Vite · Tailwind CSS · Recharts · Lucide Icons |
| Models | OpenAI API · Cohere API · HuggingFace sentence-transformers |

## 📁 Project Structure

```
embedding-model-comparison/
├── backend/     # FastAPI: datasets, model runners, metrics, UMAP, export
├── frontend/    # React + Vite: dataset/model selection, results tables, heatmaps, per-query analysis
└── README.md
```

## 🚀 Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Optional: OpenAI, Cohere API keys for cloud models
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app — select a dataset and embedding models, run the benchmark, view metrics and visualizations.

## ✨ Features

- **11+ embedding models** — OpenAI (3), Cohere (3), open-source: MiniLM, E5, BGE (5)
- **Built-in datasets** — Natural Questions, TechQA, Legal QA with ground-truth relevance
- **Full IR metrics** — Precision@K, Recall@K, MRR, NDCG@K, MAP, Hit Rate@K
- **Performance** — Latency percentiles, throughput, memory, API cost
- **Embedding quality** — Isotropy analysis, UMAP visualization
- **Interactive dashboard** — Radar charts, heatmaps, sortable tables, per-query analysis
- **Export** — Download results as JSON or Markdown
