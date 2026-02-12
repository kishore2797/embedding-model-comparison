"""Model listing and validation routes."""

import asyncio
from typing import List
from fastapi import APIRouter

from app.models.schemas import ModelInfo, ValidateModelsRequest, ValidateModelsResponse
from app.embeddings.registry import list_models, validate_model

router = APIRouter()


@router.get("/models", response_model=List[ModelInfo])
async def get_models():
    """List all available embedding models with metadata."""
    return list_models()


@router.post("/models/validate", response_model=ValidateModelsResponse)
async def validate_models(request: ValidateModelsRequest):
    """Check accessibility of selected models."""
    results = {}
    for model_id in request.model_ids:
        status = await asyncio.to_thread(validate_model, model_id)
        results[model_id] = status
    return ValidateModelsResponse(results=results)
