"""Pydantic request/response schemas for the API."""

from typing import Any
from pydantic import BaseModel, Field


# ---------- /api/eval ----------
class EvalTestCase(BaseModel):
    input: str
    expected: str
    tags: list[str] = []


class EvalRequest(BaseModel):
    test_cases: list[EvalTestCase] | None = None
    pass_threshold: float = 0.5


class EvalResultItem(BaseModel):
    input: str
    expected: str
    actual: str
    score: float
    latency_ms: float
    tags: list[str]
    passed: bool


class EvalResponse(BaseModel):
    results: list[EvalResultItem]
    summary: dict[str, Any]


# ---------- /api/judge ----------
class JudgeTestCase(BaseModel):
    input: str
    expected: str = ""


class JudgeRequest(BaseModel):
    test_cases: list[JudgeTestCase] | None = None


class JudgeScores(BaseModel):
    accuracy: int
    relevance: int
    completeness: int
    clarity: int
    safety: int
    total: int
    average: float
    reasoning: str
    passed: bool


class JudgeResultItem(BaseModel):
    query: str
    response: str
    reference: str
    scores: JudgeScores


class JudgeResponse(BaseModel):
    results: list[JudgeResultItem]
    summary: dict[str, Any]


# ---------- /api/adversarial ----------
class AdversarialTest(BaseModel):
    name: str
    attack_type: str
    input: str
    expected_behavior: str = "refuse"
    refusal_keywords: list[str] = []
    forbidden_keywords: list[str] = []
    description: str = ""


class AdversarialRequest(BaseModel):
    tests: list[AdversarialTest] | None = None


class AdversarialResultItem(BaseModel):
    name: str
    attack_type: str
    input: str
    output: str
    passed: bool
    failure_reason: str
    description: str


class AdversarialResponse(BaseModel):
    results: list[AdversarialResultItem]
    summary: dict[str, Any]


# ---------- /api/rag ----------
class RAGRequest(BaseModel):
    query: str
    contexts: list[str]
    response: str
    ground_truth: str | None = None


class RAGResponse(BaseModel):
    query: str
    response: str
    context_relevance: float
    groundedness: float
    answer_relevance: float
    overall: float
    passed: bool
    details: dict[str, Any]


# ---------- /api/bias ----------
class BiasTemplate(BaseModel):
    name: str
    template: str
    category: str = ""


class BiasRequest(BaseModel):
    templates: list[BiasTemplate] | None = None


class BiasAnalysisItem(BaseModel):
    template_name: str
    category: str
    responses_by_identity: dict[str, str]
    sentiment_by_identity: dict[str, float]
    bias_score: float
    bias_detected: bool
    details: dict[str, Any]


class BiasResponse(BaseModel):
    analyses: list[BiasAnalysisItem]
    summary: dict[str, Any]


# ---------- /api/consistency ----------
class ParaphraseSet(BaseModel):
    id: str
    variations: list[str]
    expected: str = ""


class ConsistencyRequest(BaseModel):
    paraphrase_sets: list[ParaphraseSet] | None = None
    runs_per_variation: int = 1


class ConsistencyItem(BaseModel):
    question_id: str
    consistency_score: float
    is_consistent: bool
    variations: list[str]
    responses: list[str]
    core_answers: list[str]


class ConsistencyResponse(BaseModel):
    analyses: list[ConsistencyItem]
    summary: dict[str, Any]


# ---------- /api/health ----------
class HealthResponse(BaseModel):
    status: str
    ollama_reachable: bool
    ollama_host: str
    ollama_model: str
    models_available: list[str]
    active_provider: str = "unknown"
    openrouter_configured: bool = False
    openrouter_model: str = ""
