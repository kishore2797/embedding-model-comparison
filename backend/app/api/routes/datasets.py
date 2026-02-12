"""Dataset management routes."""

from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.schemas import DatasetInfo, DatasetFull
from app.datasets.loader import list_datasets, get_dataset, add_uploaded_dataset
from app.datasets.builder import build_dataset


class BuildDatasetRequest(BaseModel):
    name: str
    description: str = ""
    category: str = "custom"
    documents: List[dict]
    queries: List[dict]

router = APIRouter()


@router.get("/datasets", response_model=List[DatasetInfo])
async def get_datasets():
    """List available datasets (built-in + uploaded)."""
    return list_datasets()


@router.get("/datasets/{dataset_id}", response_model=DatasetFull)
async def get_dataset_by_id(dataset_id: str):
    """Get full dataset with documents and queries."""
    ds = get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    return ds


@router.post("/datasets/upload", response_model=DatasetInfo)
async def upload_dataset(data: dict):
    """Upload a custom dataset."""
    required = ["id", "name", "description", "documents", "queries"]
    for field in required:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    for doc in data["documents"]:
        if "doc_id" not in doc or "text" not in doc:
            raise HTTPException(status_code=400, detail="Each document must have 'doc_id' and 'text'")

    for q in data["queries"]:
        if "query" not in q or "relevant_doc_ids" not in q:
            raise HTTPException(status_code=400, detail="Each query must have 'query' and 'relevant_doc_ids'")

    return add_uploaded_dataset(data)


@router.post("/datasets/build", response_model=DatasetInfo)
async def build_custom_dataset(request: BuildDatasetRequest):
    """Create a custom dataset from documents and queries."""
    try:
        return build_dataset(
            name=request.name,
            description=request.description,
            category=request.category,
            documents=request.documents,
            queries=request.queries,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
