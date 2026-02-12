"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.api.routes import models, datasets, benchmark, results, explore, health

app = FastAPI(
    title="Embedding Model Comparison API",
    version="1.0.0",
    description="Benchmark embedding models on retrieval accuracy, latency, and cost",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(models.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(benchmark.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(explore.router, prefix="/api")
app.include_router(health.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": "Embedding Model Comparison",
        "version": "1.0.0",
        "docs": "/docs",
    }
