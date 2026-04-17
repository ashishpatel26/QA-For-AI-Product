import {
  Box, Grid, Alert, Chip, Typography, Stack, Paper,
} from "@mui/material";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorIcon from "@mui/icons-material/ErrorRounded";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import RunButton from "../components/RunButton";
import Gauge from "../components/Gauge";
import ProgressPanel from "../components/ProgressPanel";
import { useStreamedRun } from "../hooks/useStreamedRun";
import type { ConsistencyResponse } from "../api";

export default function ConsistencyPage() {
  const { loading, progress, result: data, error, run } = useStreamedRun<ConsistencyResponse>("/api/consistency/stream");

  return (
    <Box>
      <PageHeader
        icon={<LoopRoundedIcon />}
        title="Consistency Check"
        subtitle="Paraphrase the same question many ways · measure answer stability."
        part="Part 2.3"
        right={<RunButton onClick={() => run({})} loading={loading} label="Run Consistency" />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <ProgressPanel loading={loading} progress={progress} />
      {!data && !loading && (
        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          Each question is asked in multiple paraphrased forms. High consistency = stable model.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Question Sets" value={data.summary.total} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Consistent" value={data.summary.consistent} accent="success" icon={<CheckCircleIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Inconsistent" value={data.summary.inconsistent} accent="error" icon={<ErrorIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Avg Score"
                value={data.summary.avg_score.toFixed(2)}
                accent="secondary"
                caption="1.0 = perfect"
              />
            </Grid>
          </Grid>

          <Stack spacing={3}>
            {data.analyses.map((a, i) => (
              <SectionCard
                key={i}
                title={a.question_id}
                subtitle={`${a.variations.length} paraphrases`}
                action={
                  <Chip
                    label={a.is_consistent ? "STABLE" : "UNSTABLE"}
                    color={a.is_consistent ? "success" : "error"}
                    variant="outlined"
                    size="small"
                  />
                }
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Gauge
                        value={a.consistency_score * 100}
                        label="score"
                        size={160}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 9 }}>
                    <Stack spacing={1.5}>
                      {a.variations.map((v, j) => (
                        <Paper
                          key={j}
                          sx={{
                            p: 2,
                            bgcolor: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                            <Chip
                              size="small"
                              label={`#${j + 1}`}
                              sx={{
                                bgcolor: "rgba(124,77,255,0.15)",
                                color: "primary.light",
                                minWidth: 40,
                                fontWeight: 700,
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {v}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                                → {a.responses[j]}
                              </Typography>
                              {a.core_answers[j] && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    size="small"
                                    label={`core: ${a.core_answers[j]}`}
                                    sx={{
                                      bgcolor: "rgba(0,229,255,0.1)",
                                      color: "secondary.light",
                                      height: 22,
                                      fontSize: 11,
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </SectionCard>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}
