"""Model registry — factory for creating embedder instances."""

from typing import Dict, Optional

from app.config import MODEL_REGISTRY, OPENAI_API_KEY, COHERE_API_KEY
from app.embeddings.base import BaseEmbedder
from app.embeddings.openai_embedder import OpenAIEmbedder
from app.embeddings.cohere_embedder import CohereEmbedder
from app.embeddings.local_embedder import LocalEmbedder
from app.models.schemas import ModelInfo, ModelStatus


_PROVIDER_MAP = {
    "openai": OpenAIEmbedder,
    "cohere": CohereEmbedder,
    "local": LocalEmbedder,
}

# Cache of instantiated embedders
_embedder_cache: Dict[str, BaseEmbedder] = {}


def get_embedder(model_id: str) -> BaseEmbedder:
    """Get or create an embedder instance by model_id."""
    if model_id in _embedder_cache:
        return _embedder_cache[model_id]

    entry = MODEL_REGISTRY.get(model_id)
    if not entry:
        raise ValueError(f"Unknown model: {model_id}")

    cls = _PROVIDER_MAP.get(entry["provider"])
    if not cls:
        raise ValueError(f"Unknown provider: {entry['provider']}")

    embedder = cls(
        model_id=model_id,
        model_name=entry["model_name"],
        dimension=entry["dimension"],
        query_prefix=entry.get("query_prefix", ""),
        document_prefix=entry.get("document_prefix", ""),
    )
    _embedder_cache[model_id] = embedder
    return embedder


def list_models() -> list[ModelInfo]:
    """List all registered models with their metadata and status."""
    results = []
    for model_id, entry in MODEL_REGISTRY.items():
        status = ModelStatus.ready
        if entry["provider"] == "openai" and not OPENAI_API_KEY:
            status = ModelStatus.api_key_missing
        elif entry["provider"] == "cohere" and not COHERE_API_KEY:
            status = ModelStatus.api_key_missing

        results.append(ModelInfo(
            id=model_id,
            provider=entry["provider"],
            model_name=entry["model_name"],
            dimension=entry["dimension"],
            max_tokens=entry["max_tokens"],
            cost_per_1k_tokens=entry["cost_per_1k_tokens"],
            description=entry["description"],
            query_prefix=entry.get("query_prefix", ""),
            document_prefix=entry.get("document_prefix", ""),
            status=status,
        ))
    return results


def validate_model(model_id: str) -> ModelStatus:
    """Check if a model is accessible and working."""
    entry = MODEL_REGISTRY.get(model_id)
    if not entry:
        return ModelStatus.error

    if entry["provider"] == "openai" and not OPENAI_API_KEY:
        return ModelStatus.api_key_missing
    if entry["provider"] == "cohere" and not COHERE_API_KEY:
        return ModelStatus.api_key_missing

    try:
        embedder = get_embedder(model_id)
        if embedder.is_available():
            return ModelStatus.ready
        return ModelStatus.error
    except Exception:
        return ModelStatus.error
