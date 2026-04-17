import { useMemo, useState } from "react";
import {
  Box, Grid, Alert, Chip, Typography, Stack, TextField, Button, Paper,
} from "@mui/material";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import RunButton from "../components/RunButton";
import Gauge from "../components/Gauge";
import ProgressPanel from "../components/ProgressPanel";
import { useStreamedRun } from "../hooks/useStreamedRun";
import type { RAGResponse } from "../api";

const SAMPLE = {
  query: "What is the capital of France?",
  contexts: [
    "France is a country in Western Europe. Paris is the capital city of France.",
    "Paris is known for the Eiffel Tower and is home to about 2 million people.",
  ],
  response: "The capital of France is Paris. Paris is known for landmarks like the Eiffel Tower.",
};

export default function RagPage() {
  const [query, setQuery] = useState(SAMPLE.query);
  const [contexts, setContexts] = useState<string[]>(SAMPLE.contexts);
  const [response, setResponse] = useState(SAMPLE.response);

  const payload = useMemo(() => ({
    query,
    contexts: contexts.filter((c) => c.trim()),
    response,
  }), [query, contexts, response]);

  const { loading, progress, result: data, error, run } = useStreamedRun<RAGResponse>("/api/rag/stream", payload);

  return (
    <Box>
      <PageHeader
        icon={<HubRoundedIcon />}
        title="RAG Evaluation Triad"
        subtitle="Context Relevance · Groundedness · Answer Relevance — all three must pass for production."
        part="Part 5.1"
        right={<RunButton onClick={() => run(payload)} loading={loading} label="Evaluate RAG" />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <ProgressPanel loading={loading} progress={progress} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Inputs" subtitle="Query, retrieved context, generated response">
            <Stack spacing={2}>
              <TextField
                label="Query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                size="small"
              />
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Retrieved Contexts</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setContexts([...contexts, ""])}
                  >
                    Add
                  </Button>
                </Box>
                <Stack spacing={1}>
                  {contexts.map((c, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        value={c}
                        onChange={(e) => {
                          const next = [...contexts];
                          next[i] = e.target.value;
                          setContexts(next);
                        }}
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setContexts(contexts.filter((_, j) => j !== i))}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
              <TextField
                label="Generated Response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
              />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Triad Scores" subtitle="Groundedness weighted 50%">
            {!data ? (
              <Alert severity="info" variant="outlined" sx={{ borderColor: "rgba(0,229,255,0.3)" }}>
                Fill the inputs and click <b>Evaluate RAG</b>. Sample data pre-loaded.
              </Alert>
            ) : (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 2, py: 2 }}>
                  <Gauge
                    value={data.context_relevance * 100}
                    label="Context"
                    colorOverride="#00E5FF"
                  />
                  <Gauge
                    value={data.groundedness * 100}
                    label="Groundedness"
                    colorOverride="#7C4DFF"
                  />
                  <Gauge
                    value={data.answer_relevance * 100}
                    label="Answer"
                    colorOverride="#00E676"
                  />
                </Box>
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Overall Score</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {(data.overall * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Chip
                    label={data.passed ? "PASSED — Production ready" : "FAILED — Groundedness below 85%"}
                    color={data.passed ? "success" : "error"}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </>
            )}
          </SectionCard>
        </Grid>

        {data && (
          <Grid size={12}>
            <SectionCard title="Analysis" subtitle="Claims, hallucinations, details">
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="overline" color="text.secondary">Contexts</Typography>
                  <Typography variant="h5">{data.details.num_contexts}</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="overline" color="text.secondary">Claims</Typography>
                  <Typography variant="h5">{data.details.num_claims}</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="overline" color="text.secondary">Hallucinations</Typography>
                  <Typography variant="h5" color={data.details.num_hallucinations > 0 ? "error.main" : "success.main"}>
                    {data.details.num_hallucinations}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="overline" color="text.secondary">Response Length</Typography>
                  <Typography variant="h5">{data.details.response_length}w</Typography>
                </Grid>

                {data.details.hallucinations.length > 0 && (
                  <Grid size={12}>
                    <Typography variant="overline" color="text.secondary">Hallucinated Claims</Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {data.details.hallucinations.map((h, i) => (
                        <Paper
                          key={i}
                          sx={{
                            p: 1.5,
                            bgcolor: "rgba(255,82,82,0.06)",
                            border: "1px solid rgba(255,82,82,0.3)",
                          }}
                        >
                          <Typography variant="body2">{h}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </SectionCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
