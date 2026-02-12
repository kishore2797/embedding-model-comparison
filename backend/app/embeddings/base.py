"""Abstract base class for embedding providers."""

from abc import ABC, abstractmethod
from typing import List
import numpy as np


class BaseEmbedder(ABC):
    """Interface that all embedding providers must implement."""

    def __init__(self, model_id: str, model_name: str, dimension: int,
                 query_prefix: str = "", document_prefix: str = ""):
        self.model_id = model_id
        self.model_name = model_name
        self.dimension = dimension
        self.query_prefix = query_prefix
        self.document_prefix = document_prefix

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> np.ndarray:
        """Embed a list of documents. Returns (n, dimension) array."""
        ...

    @abstractmethod
    def embed_queries(self, texts: List[str]) -> np.ndarray:
        """Embed a list of queries. Returns (n, dimension) array."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this model is ready to use."""
        ...

    def _prepend_prefix(self, texts: List[str], prefix: str) -> List[str]:
        if not prefix:
            return texts
        return [prefix + t for t in texts]
