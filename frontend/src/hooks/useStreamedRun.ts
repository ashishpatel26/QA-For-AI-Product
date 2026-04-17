import { useState, useCallback } from "react";

export interface ProgressEvent {
  step: number;
  total: number;
  label: string;
}

export interface StreamState<T> {
  loading: boolean;
  progress: ProgressEvent | null;
  result: T | null;
  error: string | null;
}

export function useStreamedRun<T>(endpoint: string, body: unknown = {}) {
  const [state, setState] = useState<StreamState<T>>({
    loading: false,
    progress: null,
    result: null,
    error: null,
  });

  const run = useCallback(async (bodyOverride?: unknown) => {
    setState({ loading: true, progress: null, result: null, error: null });

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyOverride ?? body),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => resp.statusText);
        setState((s) => ({ ...s, loading: false, error: text }));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE lines: "data: {...}\n\n"
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "progress") {
              setState((s) => ({
                ...s,
                progress: { step: event.step, total: event.total, label: event.label },
              }));
            } else if (event.type === "done") {
              setState({ loading: false, progress: null, result: event.result as T, error: null });
            } else if (event.type === "error") {
              setState({ loading: false, progress: null, result: null, error: event.message });
            }
          } catch {
            // malformed JSON — skip
          }
        }
      }
    } catch (err) {
      setState({
        loading: false,
        progress: null,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [endpoint, body]);

  const reset = useCallback(() => {
    setState({ loading: false, progress: null, result: null, error: null });
  }, []);

  return { ...state, run, reset };
}
