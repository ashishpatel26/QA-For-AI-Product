# Ollama GPU Setup (Windows) + App Integration

Use this file as a one-stop runbook to start Ollama on your local GPU and connect it to this project.

---

## 1) Install / Update Ollama

- Install the latest Ollama for Windows from the official site.
- If already installed, update to the latest version.

---

## 2) Start Ollama server

```bash
ollama serve
```

Keep this terminal running.

---

## 3) Pull model

In a new terminal:

```bash
ollama pull gemma3:4b
```

---

## 4) Test inference

```bash
ollama run gemma3:4b "hello"
```

If you get a model response, Ollama is working.

---

## 5) Verify GPU usage

Use either:

- **Task Manager** → Performance → GPU
- or command line:

```bash
nvidia-smi -l 1
```

---

## 6) Point this app to local Ollama

### PowerShell

```bash
$env:OLLAMA_HOST="http://localhost:11434"
$env:OLLAMA_MODEL="gemma3:4b"
```

---

## 7) Run backend

```bash
uv run uvicorn backend.main:app --reload --port 8000
```

Check:

- http://localhost:8000/api/health

---

## 8) Run frontend

```bash
cd frontend
npm run dev
```

Open:

- http://localhost:5173

---

## 9) If using Docker backend (container calls host Ollama)

Use:

```bash
OLLAMA_HOST=http://host.docker.internal:11434
```

Example (PowerShell):

```bash
$env:OLLAMA_HOST="http://host.docker.internal:11434"
docker compose up --build
```

---

## Troubleshooting quick notes

- `ECONNREFUSED /api/health` in frontend means backend is not running on port `8000`.
- Ensure `ollama serve` is running before backend requests model calls.
- If GPU VRAM is low, use a smaller model or quantized variant.

---

## RTX 3060-specific notes (from official docs + references)

Based on current Ollama docs and related references:

1. **RTX 3060 is supported by Ollama GPU path**
   - Ollama states NVIDIA GPUs with compute capability **5.0+** and driver **531+** are supported.
   - RTX 3060 is listed under compute capability **8.6** (GeForce RTX 30xx family).

2. **Official source (recommended to follow first):**
   - https://docs.ollama.com/gpu

3. **If you have multiple GPUs**
   - You can constrain visible GPUs with:
   - `CUDA_VISIBLE_DEVICES`
   - Example:
     ```bash
     CUDA_VISIBLE_DEVICES=0 ollama serve
     ```

4. **Model sizing for RTX 3060 (common practical guidance)**
   - 4-bit quantized models are typically the safest for 8GB-class VRAM.
   - Start with smaller models first (e.g., 4B/7B quantized) and scale up.

5. **Useful check commands**
   - Verify NVIDIA GPU and driver:
     ```bash
     nvidia-smi
     ```
   - Verify Ollama model run:
     ```bash
     ollama run gemma3:4b "hello"
     ```

