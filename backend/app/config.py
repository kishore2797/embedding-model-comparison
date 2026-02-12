"""Application configuration and model registry."""

import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

# ── Model Registry ──────────────────────────────────────────────────────────

MODEL_REGISTRY = {
    # OpenAI models
    "openai/text-embedding-3-small": {
        "provider": "openai",
        "model_name": "text-embedding-3-small",
        "dimension": 1536,
        "max_tokens": 8191,
        "cost_per_1k_tokens": 0.00002,
        "description": "OpenAI small v3 — best value",
    },
    "openai/text-embedding-3-large": {
        "provider": "openai",
        "model_name": "text-embedding-3-large",
        "dimension": 3072,
        "max_tokens": 8191,
        "cost_per_1k_tokens": 0.00013,
        "description": "OpenAI large v3 — highest quality",
    },
    "openai/text-embedding-ada-002": {
        "provider": "openai",
        "model_name": "text-embedding-ada-002",
        "dimension": 1536,
        "max_tokens": 8191,
        "cost_per_1k_tokens": 0.0001,
        "description": "OpenAI Ada v2 — legacy",
    },
    # Cohere models
    "cohere/embed-english-v3.0": {
        "provider": "cohere",
        "model_name": "embed-english-v3.0",
        "dimension": 1024,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0001,
        "description": "Cohere English v3 — high quality",
    },
    "cohere/embed-english-light-v3.0": {
        "provider": "cohere",
        "model_name": "embed-english-light-v3.0",
        "dimension": 384,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0001,
        "description": "Cohere English Light v3 — fast & compact",
    },
    "cohere/embed-multilingual-v3.0": {
        "provider": "cohere",
        "model_name": "embed-multilingual-v3.0",
        "dimension": 1024,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0001,
        "description": "Cohere Multilingual v3",
    },
    # Open-source: all-MiniLM
    "local/all-MiniLM-L6-v2": {
        "provider": "local",
        "model_name": "sentence-transformers/all-MiniLM-L6-v2",
        "dimension": 384,
        "max_tokens": 256,
        "cost_per_1k_tokens": 0.0,
        "description": "MiniLM — lightweight, fast, 384d",
    },
    # Open-source: E5
    "local/e5-small-v2": {
        "provider": "local",
        "model_name": "intfloat/e5-small-v2",
        "dimension": 384,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0,
        "query_prefix": "query: ",
        "document_prefix": "passage: ",
        "description": "E5 Small — 384d, needs prefixes",
    },
    "local/e5-base-v2": {
        "provider": "local",
        "model_name": "intfloat/e5-base-v2",
        "dimension": 768,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0,
        "query_prefix": "query: ",
        "document_prefix": "passage: ",
        "description": "E5 Base — 768d, needs prefixes",
    },
    # Open-source: BGE
    "local/bge-small-en-v1.5": {
        "provider": "local",
        "model_name": "BAAI/bge-small-en-v1.5",
        "dimension": 384,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0,
        "query_prefix": "Represent this sentence for searching relevant passages: ",
        "description": "BGE Small — 384d, instruction prefix for queries",
    },
    "local/bge-base-en-v1.5": {
        "provider": "local",
        "model_name": "BAAI/bge-base-en-v1.5",
        "dimension": 768,
        "max_tokens": 512,
        "cost_per_1k_tokens": 0.0,
        "query_prefix": "Represent this sentence for searching relevant passages: ",
        "description": "BGE Base — 768d, instruction prefix for queries",
    },
}

DEFAULT_TOP_K_VALUES = [1, 3, 5, 10, 20]
DEFAULT_SIMILARITY_METRIC = "cosine"
MAX_DATASET_DOCUMENTS = 1000
MAX_DATASET_QUERIES = 500
