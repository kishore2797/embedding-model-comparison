"""Custom dataset creation from documents and queries."""

import uuid
from typing import List, Dict, Optional

from app.datasets.loader import add_uploaded_dataset
from app.models.schemas import DatasetInfo


def build_dataset(
    name: str,
    description: str,
    category: str,
    documents: List[Dict],
    queries: List[Dict],
) -> DatasetInfo:
    """Create a custom dataset from user-provided documents and queries.

    documents: list of {"text": str, "doc_id": optional str, "metadata": optional dict}
    queries: list of {"query": str, "relevant_doc_ids": list[str], "relevance_grades": optional dict}
    """
    # Auto-assign doc_ids if missing
    for i, doc in enumerate(documents):
        if "doc_id" not in doc or not doc["doc_id"]:
            doc["doc_id"] = f"doc_{i+1:03d}"

    # Validate that every query references existing doc_ids
    all_doc_ids = {d["doc_id"] for d in documents}
    for q in queries:
        for rid in q.get("relevant_doc_ids", []):
            if rid not in all_doc_ids:
                raise ValueError(f"Query references unknown doc_id '{rid}'. Available: {sorted(all_doc_ids)}")
        if not q.get("relevant_doc_ids"):
            raise ValueError(f"Query '{q.get('query', '')[:50]}...' has no relevant_doc_ids")

    ds_id = f"custom_{uuid.uuid4().hex[:8]}"
    raw = {
        "id": ds_id,
        "name": name,
        "description": description,
        "category": category or "custom",
        "documents": documents,
        "queries": queries,
    }

    return add_uploaded_dataset(raw)
