"""Dataset loading, validation, and management."""

import os
import json
from typing import List, Optional, Dict

from app.models.schemas import DatasetInfo, DatasetFull, DatasetDocument, RelevanceJudgment

_BUILTIN_DIR = os.path.join(os.path.dirname(__file__), "builtin")

# In-memory store for uploaded datasets
_uploaded_datasets: Dict[str, dict] = {}


def _load_builtin(filename: str) -> dict:
    path = os.path.join(_BUILTIN_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _dataset_info(raw: dict, is_builtin: bool = True) -> DatasetInfo:
    docs = raw.get("documents", [])
    queries = raw.get("queries", [])
    avg_len = sum(len(d["text"]) for d in docs) / max(len(docs), 1)
    return DatasetInfo(
        id=raw["id"],
        name=raw["name"],
        description=raw["description"],
        document_count=len(docs),
        query_count=len(queries),
        avg_doc_length=round(avg_len, 1),
        category=raw.get("category", "general"),
        is_builtin=is_builtin,
    )


def _dataset_full(raw: dict, is_builtin: bool = True) -> DatasetFull:
    docs = [DatasetDocument(**d) for d in raw["documents"]]
    queries = [RelevanceJudgment(**q) for q in raw["queries"]]
    avg_len = sum(len(d.text) for d in docs) / max(len(docs), 1)
    return DatasetFull(
        id=raw["id"],
        name=raw["name"],
        description=raw["description"],
        document_count=len(docs),
        query_count=len(queries),
        avg_doc_length=round(avg_len, 1),
        category=raw.get("category", "general"),
        is_builtin=is_builtin,
        documents=docs,
        queries=queries,
    )


def list_datasets() -> List[DatasetInfo]:
    results = []
    # Built-in datasets
    for fname in sorted(os.listdir(_BUILTIN_DIR)):
        if fname.endswith(".json"):
            try:
                raw = _load_builtin(fname)
                results.append(_dataset_info(raw, is_builtin=True))
            except Exception:
                continue
    # Uploaded datasets
    for ds_id, raw in _uploaded_datasets.items():
        results.append(_dataset_info(raw, is_builtin=False))
    return results


def get_dataset(dataset_id: str) -> Optional[DatasetFull]:
    # Check uploaded first
    if dataset_id in _uploaded_datasets:
        return _dataset_full(_uploaded_datasets[dataset_id], is_builtin=False)
    # Check built-in
    for fname in os.listdir(_BUILTIN_DIR):
        if fname.endswith(".json"):
            try:
                raw = _load_builtin(fname)
                if raw["id"] == dataset_id:
                    return _dataset_full(raw, is_builtin=True)
            except Exception:
                continue
    return None


def get_dataset_raw(dataset_id: str) -> Optional[dict]:
    """Get raw dict for benchmark runner."""
    if dataset_id in _uploaded_datasets:
        return _uploaded_datasets[dataset_id]
    for fname in os.listdir(_BUILTIN_DIR):
        if fname.endswith(".json"):
            try:
                raw = _load_builtin(fname)
                if raw["id"] == dataset_id:
                    return raw
            except Exception:
                continue
    return None


def add_uploaded_dataset(data: dict) -> DatasetInfo:
    """Add a user-uploaded dataset."""
    ds_id = data["id"]
    _uploaded_datasets[ds_id] = data
    return _dataset_info(data, is_builtin=False)
