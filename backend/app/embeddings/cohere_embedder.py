"""Cohere embedding provider."""

from typing import List
import numpy as np

from app.embeddings.base import BaseEmbedder
from app.config import COHERE_API_KEY


class CohereEmbedder(BaseEmbedder):

    def __init__(self, model_id: str, model_name: str, dimension: int, **kwargs):
        super().__init__(model_id, model_name, dimension, **kwargs)
        self._client = None

    def _get_client(self):
        if self._client is None:
            import cohere
            self._client = cohere.Client(api_key=COHERE_API_KEY)
        return self._client

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        client = self._get_client()
        resp = client.embed(texts=texts, model=self.model_name, input_type="search_document")
        return np.array(resp.embeddings, dtype=np.float32)

    def embed_queries(self, texts: List[str]) -> np.ndarray:
        client = self._get_client()
        resp = client.embed(texts=texts, model=self.model_name, input_type="search_query")
        return np.array(resp.embeddings, dtype=np.float32)

    def is_available(self) -> bool:
        if not COHERE_API_KEY:
            return False
        try:
            self._get_client().embed(texts=["test"], model=self.model_name, input_type="search_query")
            return True
        except Exception:
            return False
