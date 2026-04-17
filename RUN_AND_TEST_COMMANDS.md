# Run & Test Commands (Verified)

This file contains the command list to run and validate the project locally.

## ✅ Commands already run successfully

```bash
python -m py_compile backend/services.py 05_bias_audit.py
npm --prefix frontend run build
```

Both commands passed.

---

## 1) Run Ollama on local GPU

```bash
ollama serve
```

In a new terminal:

```bash
ollama pull gemma3:4b
ollama run gemma3:4b "hello"
```

Optional GPU monitor:

```bash
nvidia-smi -l 1
```

---

## 2) Run backend (local)

### PowerShell

```bash
$env:OLLAMA_HOST="http://localhost:11434"
$env:OLLAMA_MODEL="gemma3:4b"
$env:FAST_MODE="1"
$env:QA_MAX_WORKERS="8"
$env:QA_CACHE="1"
uv run uvicorn backend.main:app --reload --port 8000
```

Backend URLs:
- http://localhost:8000/docs
- http://localhost:8000/api/health

---

## 3) Run frontend (local)

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend URL:
- http://localhost:5173 (or next free Vite port)

---

## 4) Run bias audit script directly

### PowerShell

```bash
$env:BIAS_MAX_WORKERS="8"
python 05_bias_audit.py
```

Output file:
- `bias_results.json`

---

## 5) Docker run (optional)

If Docker is installed and running:

```bash
docker compose up --build
```

If backend container should call host Ollama:

```bash
set OLLAMA_HOST=http://host.docker.internal:11434
docker compose up --build
```

---

## 6) Quick validation commands

```bash
python -m py_compile backend/services.py 05_bias_audit.py
npm --prefix frontend run build
```
