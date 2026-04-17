FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_COMPILE_BYTECODE=1

WORKDIR /app

# Install runtime dependencies with uv
COPY pyproject.toml /app/pyproject.toml
RUN uv pip install --system \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "pydantic>=2.9.0"

# App source (backend + root runner modules imported by adapters/services)
COPY backend /app/backend
COPY ollama_client.py /app/ollama_client.py
COPY 01_eval_runner.py /app/01_eval_runner.py
COPY 02_llm_judge.py /app/02_llm_judge.py
COPY 03_adversarial_tests.py /app/03_adversarial_tests.py
COPY 04_rag_triad.py /app/04_rag_triad.py
COPY 05_bias_audit.py /app/05_bias_audit.py
COPY 06_consistency_check.py /app/06_consistency_check.py

# Run as non-root for better security defaults
RUN useradd -u 10001 -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "uvloop", "--http", "httptools"]
