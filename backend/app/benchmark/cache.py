"""Embedding cache — avoids re-computing embeddings across runs."""

import numpy as np
from typing import Dict, Optional, Tuple


class EmbeddingCache:
    """In-memory cache keyed by (model_id, dataset_id)."""

    def __init__(self):
        self._doc_embeddings: Dict[Tuple[str, str], np.ndarray] = {}
        self._doc_ids: Dict[Tuple[str, str], list] = {}

    def get_doc_embeddings(self, model_id: str, dataset_id: str) -> Optional[Tuple[np.ndarray, list]]:
        key = (model_id, dataset_id)
        if key in self._doc_embeddings:
            return self._doc_embeddings[key], self._doc_ids[key]
        return None

    def set_doc_embeddings(self, model_id: str, dataset_id: str, embeddings: np.ndarray, doc_ids: list):
        key = (model_id, dataset_id)
        self._doc_embeddings[key] = embeddings
        self._doc_ids[key] = doc_ids

    def has(self, model_id: str, dataset_id: str) -> bool:
        return (model_id, dataset_id) in self._doc_embeddings

    def clear(self):
        self._doc_embeddings.clear()
        self._doc_ids.clear()

    def clear_model(self, model_id: str):
        keys_to_remove = [k for k in self._doc_embeddings if k[0] == model_id]
        for k in keys_to_remove:
            del self._doc_embeddings[k]
            del self._doc_ids[k]


# Global singleton
embedding_cache = EmbeddingCache()
