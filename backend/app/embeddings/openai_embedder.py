"""OpenAI embedding provider."""

from typing import List
import numpy as np

from app.embeddings.base import BaseEmbedder
from app.config import OPENAI_API_KEY


class OpenAIEmbedder(BaseEmbedder):

    def __init__(self, model_id: str, model_name: str, dimension: int, **kwargs):
        super().__init__(model_id, model_name, dimension, **kwargs)
        self._client = None

    def _get_client(self):
        if self._client is None:
            from openai import OpenAI
            self._client = OpenAI(api_key=OPENAI_API_KEY)
        return self._client

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        client = self._get_client()
        resp = client.embeddings.create(input=texts, model=self.model_name)
        vecs = [item.embedding for item in resp.data]
        return np.array(vecs, dtype=np.float32)

    def embed_queries(self, texts: List[str]) -> np.ndarray:
        return self.embed_documents(texts)

    def is_available(self) -> bool:
        if not OPENAI_API_KEY:
            return False
        try:
            self._get_client().embeddings.create(input=["test"], model=self.model_name)
            return True
        except Exception:
            return False
