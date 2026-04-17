import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 900_000, // 15 min — adversarial sweeps can be long
});

// -------- shared types ----------
export interface EvalResultItem {
  input: string;
  expected: string;
  actual: string;
  score: number;
  latency_ms: number;
  tags: string[];
  passed: boolean;
}

export interface EvalResponse {
  results: EvalResultItem[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    avg_latency_ms: number;
    tag_stats: Record<string, { passed: number; total: number }>;
  };
}

export interface JudgeScores {
  accuracy: number;
  relevance: number;
  completeness: number;
  clarity: number;
  safety: number;
  total: number;
  average: number;
  reasoning: string;
  passed: boolean;
}

export interface JudgeResultItem {
  query: string;
  response: string;
  reference: string;
  scores: JudgeScores;
}

export interface JudgeResponse {
  results: JudgeResultItem[];
  summary: {
    total: number;
    passed: number;
    pass_rate: number;
    avg_criteria: Record<string, number>;
  };
}

export interface AdversarialResultItem {
  name: string;
  attack_type: string;
  input: string;
  output: string;
  passed: boolean;
  failure_reason: string;
  description: string;
}

export interface AdversarialResponse {
  results: AdversarialResultItem[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    by_attack_type: Record<string, { passed: number; total: number }>;
  };
}

export interface RAGResponse {
  query: string;
  response: string;
  context_relevance: number;
  groundedness: number;
  answer_relevance: number;
  overall: number;
  passed: boolean;
  details: {
    num_contexts: number;
    num_claims: number;
    num_hallucinations: number;
    response_length: number;
    hallucinations: string[];
    contexts: string[];
  };
}

export interface BiasAnalysisItem {
  template_name: string;
  category: string;
  responses_by_identity: Record<string, string>;
  sentiment_by_identity: Record<string, number>;
  demographic_scores: Record<string, number>;
  bias_score: number;
  bias_detected: boolean;
  bias_direction: string;
  details: Record<string, unknown>;
}

export interface BiasResponse {
  analyses: BiasAnalysisItem[];
  summary: {
    total_templates: number;
    biased: number;
    clean: number;
    bias_rate: number;
  };
}

export interface ConsistencyItem {
  question_id: string;
  consistency_score: number;
  is_consistent: boolean;
  variations: string[];
  responses: string[];
  core_answers: string[];
}

export interface ConsistencyResponse {
  analyses: ConsistencyItem[];
  summary: {
    total: number;
    consistent: number;
    inconsistent: number;
    avg_score: number;
  };
}

export interface HealthResponse {
  status: string;
  ollama_reachable: boolean;
  ollama_host: string;
  ollama_model: string;
  models_available: string[];
}
