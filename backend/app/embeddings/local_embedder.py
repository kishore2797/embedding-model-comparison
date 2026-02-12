"""Local sentence-transformers embedding provider (MiniLM, E5, BGE)."""

from typing import List
import numpy as np

from app.embeddings.base import BaseEmbedder


class LocalEmbedder(BaseEmbedder):

    def __init__(self, model_id: str, model_name: str, dimension: int,
                 query_prefix: str = "", document_prefix: str = "", **kwargs):
        super().__init__(model_id, model_name, dimension, query_prefix, document_prefix)
        self._model = None

    def _get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        model = self._get_model()
        prefixed = self._prepend_prefix(texts, self.document_prefix)
        return model.encode(prefixed, show_progress_bar=False, convert_to_numpy=True).astype(np.float32)

    def embed_queries(self, texts: List[str]) -> np.ndarray:
        model = self._get_model()
        prefixed = self._prepend_prefix(texts, self.query_prefix)
        return model.encode(prefixed, show_progress_bar=False, convert_to_numpy=True).astype(np.float32)

    def is_available(self) -> bool:
        try:
            self._get_model()
            return True
        except Exception:
            return False
