# Docker + GitHub Actions Plan

## Goal
Containerize the project (backend + frontend) and add a CI workflow that validates both Python and frontend builds/tests on every PR/push.

---

## 1) Target Architecture

- **Backend container**: FastAPI app served via `uvicorn` on port `8000`
- **Frontend container**: Vite app served in one of two modes:
  - **Dev mode** (`npm run dev`) for local development
  - **Prod mode** built static assets served by Nginx (recommended for deployment)
- **Docker Compose** to run both services together locally
- Frontend should call backend through `/api` (already aligned with Vite proxy + API base usage)

---

## 2) Files to Add

### Backend
- `backend/Dockerfile`
  - Base image: `python:3.12-slim`
  - Install project deps from `pyproject.toml` (or export/freeze requirements)
  - Copy backend + required root scripts/modules
  - Start command: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`

### Frontend
- `frontend/Dockerfile` (multi-stage recommended)
  - Stage 1: `node:20-alpine` build with `npm ci` + `npm run build`
  - Stage 2: `nginx:alpine` serve `dist/`
- `frontend/nginx.conf` (if custom routing/proxy is needed)

### Orchestration
- `docker-compose.yml`
  - `backend` service (port `8000:8000`)
  - `frontend` service (port `5173:80` or `5174:80`)
  - env vars for backend:
    - `OLLAMA_HOST`
    - `OLLAMA_MODEL`
  - optional healthchecks for both services

### Ignore files
- `.dockerignore` (root and/or per service context)
  - Ignore `node_modules`, `.git`, caches, local artifacts, logs

---

## 3) GitHub Actions CI Plan

Create `.github/workflows/ci.yml` with two jobs:

### Job A: `backend-checks`
- Trigger: `push`, `pull_request`
- Steps:
  1. Checkout
  2. Setup Python 3.12
  3. Install dependencies
  4. Run backend validation:
     - import check / startup check
     - optional formatting/lint/type checks (if added)

### Job B: `frontend-checks`
- Setup Node 20
- Cache npm dependencies
- Run:
  - `npm --prefix frontend ci`
  - `npm --prefix frontend run build`
  - optional `npm --prefix frontend run lint`

### Optional Job C: `docker-build`
- Build backend and frontend Docker images to ensure Dockerfiles stay valid:
  - `docker build -t qa-backend -f backend/Dockerfile .`
  - `docker build -t qa-frontend -f frontend/Dockerfile frontend`

---

## 4) Suggested Rollout Order

1. Add backend Dockerfile and validate local run.
2. Add frontend Dockerfile (multi-stage) and validate local run.
3. Add `docker-compose.yml` and verify end-to-end app startup.
4. Add CI workflow for Python + frontend build checks.
5. Add Docker build verification job in CI.
6. Document all commands in `README.md`.

---

## 5) Validation Checklist

- `docker compose up --build` starts both services
- UI reachable and API calls succeed
- `npm --prefix frontend run build` passes in CI
- Backend app imports and starts cleanly in CI
- Docker image build job passes on PR

---

## 6) Notes / Risks

- App depends on local Ollama runtime for real model calls; CI should not rely on Ollama unless mocked.
- Keep CI tests deterministic by avoiding live LLM calls in default pipeline.
- Large frontend bundle warning is non-blocking but can be optimized later via code splitting.

---

## 7) Next Step (Implementation Phase)

If you want, next I can implement this plan directly by adding:
- `backend/Dockerfile`
- `frontend/Dockerfile` (+ optional Nginx config)
- `docker-compose.yml`
- `.github/workflows/ci.yml`
- README updates with exact run/build commands.
