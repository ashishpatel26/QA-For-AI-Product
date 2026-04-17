# AI QA Session — Production AI Quality Stack

Hands-on demo suite for AI/LLM quality assurance. Seven standalone scripts covering accuracy, robustness, safety, bias, RAG, and consistency testing.

**Stack:** Python 3.12 · stdlib only · `uv` for env management

---

## Quick Start

### CLI scripts

```bash
uv sync                                   # install backend deps
uv run python run_all_tests.py            # run everything
uv run python 01_eval_runner.py           # run one demo
```

### Web Console (FastAPI + React)

```bash
# Terminal 1 — backend
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2 — frontend (first time: cd frontend && npm install)
cd frontend && npm run dev
```

Then open:
- **UI:** http://localhost:5173
- **API docs (Swagger):** http://localhost:8000/docs
- **API health:** http://localhost:8000/api/health

**Prereqs:** Ollama running (`ollama serve`) with `gemma3:4b` pulled.

---

## Scripts

| # | Script | Session Part | What It Does |
|---|--------|--------------|--------------|
| 🎯 | `run_all_tests.py` | ALL | Master runner — executes every demo in sequence, aggregates report |
| 1 | `01_eval_runner.py` | 2.2 Accuracy & Quality | Golden-dataset eval with exact / partial / semantic scoring |
| 2 | `02_llm_judge.py` | 5.3 Code vs LLM-Judge | LLM-as-a-Judge across 5 criteria (accuracy, relevance, clarity, completeness, tone) |
| 3 | `03_adversarial_tests.py` | 2.3 / 4 Robustness & Attacks | 13 attack types — prompt injection, jailbreak, data exfil, role override, etc. |
| 4 | `04_rag_triad.py` | 5.1 RAG Eval | RAG Triad — Context Relevance, Groundedness, Answer Relevance |
| 5 | `05_bias_audit.py` | 2.5 Safety & Compliance | Demographic bias audit via name/identity swaps |
| 6 | `06_consistency_check.py` | 2.3 Robustness | Paraphrase consistency — same question, different phrasings |

---

## Session Map

- **Part 2.2** → `01_eval_runner.py`
- **Part 2.3** → `03_adversarial_tests.py`, `06_consistency_check.py`
- **Part 2.5** → `05_bias_audit.py`
- **Part 4**   → `03_adversarial_tests.py`
- **Part 5.1** → `04_rag_triad.py`
- **Part 5.3** → `02_llm_judge.py`
- **Full run** → `run_all_tests.py`

---

## Project Layout

```
QA_Session_Code/
├── pyproject.toml           # Python 3.12, FastAPI + Pydantic
├── uv.lock
├── ollama_client.py         # shared Ollama helper (stdlib urllib)
├── 01_eval_runner.py ... 06_consistency_check.py   # demo scripts
├── run_all_tests.py         # master CLI runner
│
├── backend/                 # FastAPI wrapper
│   ├── main.py              # app + endpoints
│   ├── services.py          # scripts → JSON
│   ├── schemas.py           # Pydantic contracts
│   └── adapters.py          # importlib for digit-prefixed scripts
│
└── frontend/                # React + MUI dark console
    ├── src/
    │   ├── App.tsx, main.tsx, theme.ts, api.ts
    │   ├── layout/AppShell.tsx
    │   ├── components/ (Gauge, StatCard, PageHeader, ...)
    │   └── pages/ (Overview, Eval, Judge, Adversarial, RAG, Bias, Consistency)
    └── vite.config.ts       # proxies /api → :8000
```

Each script uses a **mock LLM** by default. Swap the `mock_llm()` function for any real API (Anthropic, OpenAI, local Ollama) — signature is `str -> str`.

---

## Model: Local Ollama (wired in)

All scripts call local Ollama via [ollama_client.py](ollama_client.py) — stdlib `urllib`, zero deps.

**Default:** `gemma3:4b` @ `http://localhost:11434`

**Override via env vars:**
```bash
# Windows PowerShell
$env:OLLAMA_MODEL="llama3.1:8b"
$env:OLLAMA_HOST="http://localhost:11434"

# bash / WSL
export OLLAMA_MODEL=llama3.1:8b
export OLLAMA_HOST=http://localhost:11434
```

**Prereq:** Ollama running (`ollama serve`) with model pulled (`ollama pull gemma3:4b`).

**Windows emoji fix** — set UTF-8 before running:
```bash
PYTHONIOENCODING=utf-8 uv run python 01_eval_runner.py
```

**Swap to another provider** — edit `ollama_client.py` or import a different function:
```python
from anthropic import Anthropic
client = Anthropic()

def real_llm(prompt: str) -> str:
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text
```

---

## Output

Each runner prints a pass/fail summary + score breakdown. `run_all_tests.py` produces a combined report across all six demos.

---

## Docker

### Build and run both services

```bash
docker compose up --build
```

Then open:
- **UI:** http://localhost:5173
- **API docs:** http://localhost:8000/docs
- **API health:** http://localhost:8000/api/health

### Environment variables (optional)

The backend container reads:
- `OLLAMA_HOST` (default: `http://host.docker.internal:11434`)
- `OLLAMA_MODEL` (default: `gemma3:4b`)

Example:

```bash
OLLAMA_HOST=http://host.docker.internal:11434 OLLAMA_MODEL=gemma3:4b docker compose up --build
```

---

## GitHub Actions CI

Workflow file: `.github/workflows/ci.yml`

It runs three jobs on push and PR:
- **backend-checks**: Python setup + backend import smoke check
- **frontend-checks**: `npm ci`, `npm run build`, `npm run lint`
- **docker-build**: verifies both backend and frontend Docker images build successfully
