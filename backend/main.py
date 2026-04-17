"""
backend/main.py — FastAPI entrypoint.

Run:
    uv run uvicorn backend.main:app --reload --port 8000
"""

import asyncio
import json
import queue as stdlib_queue
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend import services
from backend import schemas

app = FastAPI(
    title="AI QA Session API",
    version="0.1.0",
    description="FastAPI wrapper over the 6 QA demo scripts backed by local Ollama.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_executor = ThreadPoolExecutor(max_workers=4)


# ── helpers ─────────────────────────────────────────────────────────────────

async def _run(fn: Callable, payload: dict) -> dict:
    """Run a blocking service call in the thread pool."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, fn, payload)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _stream(service_fn: Callable, payload: dict) -> StreamingResponse:
    """
    Run service_fn in a thread, forward progress events via SSE,
    finish with a 'done' event carrying the full result.
    """
    q: stdlib_queue.Queue = stdlib_queue.Queue()

    def progress_cb(step: int, total: int, label: str) -> None:
        q.put_nowait({"type": "progress", "step": step, "total": total, "label": label})

    def run_in_thread() -> None:
        try:
            result = service_fn(payload, progress_cb)
            q.put_nowait({"type": "done", "result": result})
        except Exception as exc:
            q.put_nowait({"type": "error", "message": str(exc)})

    async def generate():
        loop = asyncio.get_running_loop()
        future = loop.run_in_executor(_executor, run_in_thread)

        while True:
            try:
                event = q.get_nowait()
                yield _sse(event)
                if event["type"] in ("done", "error"):
                    break
            except stdlib_queue.Empty:
                if future.done() and q.empty():
                    break
                await asyncio.sleep(0.05)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",      # disable nginx buffering
            "Connection": "keep-alive",
        },
    )


# ── standard JSON endpoints (kept for backward compat / curl testing) ────────

@app.get("/api/health", response_model=schemas.HealthResponse, tags=["Meta"])
def health():
    return services.check_health()


@app.post("/api/eval", response_model=schemas.EvalResponse, tags=["Eval"])
async def eval_endpoint(req: schemas.EvalRequest):
    return await _run(services.run_eval, req.model_dump())


@app.post("/api/judge", response_model=schemas.JudgeResponse, tags=["Judge"])
async def judge_endpoint(req: schemas.JudgeRequest):
    return await _run(services.run_judge, req.model_dump())


@app.post("/api/adversarial", response_model=schemas.AdversarialResponse, tags=["Adversarial"])
async def adversarial_endpoint(req: schemas.AdversarialRequest):
    return await _run(services.run_adversarial, req.model_dump())


@app.post("/api/rag", response_model=schemas.RAGResponse, tags=["RAG"])
async def rag_endpoint(req: schemas.RAGRequest):
    return await _run(services.run_rag, req.model_dump())


@app.post("/api/bias", response_model=schemas.BiasResponse, tags=["Bias"])
async def bias_endpoint(req: schemas.BiasRequest):
    return await _run(services.run_bias, req.model_dump())


@app.post("/api/consistency", response_model=schemas.ConsistencyResponse, tags=["Consistency"])
async def consistency_endpoint(req: schemas.ConsistencyRequest):
    return await _run(services.run_consistency, req.model_dump())


# ── SSE streaming endpoints ──────────────────────────────────────────────────

@app.post("/api/eval/stream", tags=["Eval"])
async def eval_stream(req: schemas.EvalRequest):
    return await _stream(services.run_eval, req.model_dump())


@app.post("/api/judge/stream", tags=["Judge"])
async def judge_stream(req: schemas.JudgeRequest):
    return await _stream(services.run_judge, req.model_dump())


@app.post("/api/adversarial/stream", tags=["Adversarial"])
async def adversarial_stream(req: schemas.AdversarialRequest):
    return await _stream(services.run_adversarial, req.model_dump())


@app.post("/api/rag/stream", tags=["RAG"])
async def rag_stream(req: schemas.RAGRequest):
    return await _stream(services.run_rag, req.model_dump())


@app.post("/api/bias/stream", tags=["Bias"])
async def bias_stream(req: schemas.BiasRequest):
    return await _stream(services.run_bias, req.model_dump())


@app.post("/api/consistency/stream", tags=["Consistency"])
async def consistency_stream(req: schemas.ConsistencyRequest):
    return await _stream(services.run_consistency, req.model_dump())


@app.get("/", tags=["Meta"])
def root():
    return {
        "name": "AI QA Session API",
        "docs": "/docs",
        "stream_endpoints": [
            "/api/eval/stream", "/api/judge/stream", "/api/adversarial/stream",
            "/api/rag/stream", "/api/bias/stream", "/api/consistency/stream",
        ],
    }
