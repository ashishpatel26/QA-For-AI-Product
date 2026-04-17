import {
  Box, Grid, Alert, Chip, LinearProgress, Typography, Stack, Accordion,
  AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import CancelIcon from "@mui/icons-material/CancelRounded";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import RunButton from "../components/RunButton";
import ProgressPanel from "../components/ProgressPanel";
import { useStreamedRun } from "../hooks/useStreamedRun";
import type { JudgeResponse } from "../api";

export default function JudgePage() {
  const { loading, progress, result: data, error, run } = useStreamedRun<JudgeResponse>("/api/judge/stream");

  const radarData = data
    ? Object.entries(data.summary.avg_criteria).map(([k, v]) => ({
        criterion: k.charAt(0).toUpperCase() + k.slice(1), score: v, fullMark: 5,
      }))
    : [];

  return (
    <Box>
      <PageHeader
        icon={<GavelRoundedIcon />}
        title="LLM-as-a-Judge"
        subtitle="Strong model evaluates target outputs across 5 rubric criteria."
        part="Part 5.3"
        right={<RunButton onClick={() => run({})} loading={loading} label="Run Judge Batch" />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <ProgressPanel loading={loading} progress={progress} />
      {!data && !loading && (
        <Alert severity="info" variant="outlined" sx={{ mb: 3, borderColor: "rgba(124,77,255,0.3)" }}>
          Each test case is run through target model, then scored by judge model on 5 criteria (1–5 scale).
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Total" value={data.summary.total} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Passed" value={data.summary.passed} accent="success" icon={<CheckCircleIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Pass Rate" value={`${data.summary.pass_rate.toFixed(0)}%`} accent="secondary" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Avg Total"
                value={(Object.values(data.summary.avg_criteria).reduce((a, b) => a + b, 0)).toFixed(1)}
                accent="primary"
                caption="out of 25"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Criteria Radar" subtitle="Average score per rubric dimension">
                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="criterion" tick={{ fill: "#9AA0B2", fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "#6E7383", fontSize: 10 }} />
                      <Radar
                        dataKey="score"
                        stroke="#7C4DFF"
                        strokeWidth={2}
                        fill="#7C4DFF"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Criteria Breakdown" subtitle="Average on 1-5 scale">
                <Stack spacing={2} sx={{ pt: 1 }}>
                  {Object.entries(data.summary.avg_criteria).map(([k, v]) => {
                    const pct = (v / 5) * 100;
                    return (
                      <Box key={k}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                            {k}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{v.toFixed(2)} / 5</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            "& .MuiLinearProgress-bar": {
                              background: "linear-gradient(90deg, #7C4DFF, #00E5FF)",
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <SectionCard title="Per-Query Scores" subtitle={`${data.results.length} evaluations`}>
            <Stack spacing={1}>
              {data.results.map((r, i) => (
                <Accordion
                  key={i}
                  disableGutters
                  sx={{
                    bgcolor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 2,
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                      {r.scores.passed ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2" sx={{ flex: 1 }}>{r.query}</Typography>
                      <Chip
                        size="small"
                        label={`${r.scores.total}/25`}
                        sx={{
                          bgcolor: "rgba(124,77,255,0.15)",
                          color: "primary.light",
                          fontWeight: 700,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        avg {r.scores.average.toFixed(1)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Response</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                          {r.response}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Judge Reasoning</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
                          {r.scores.reasoning}
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {(["accuracy", "relevance", "completeness", "clarity", "safety"] as const).map((k) => (
                            <Chip
                              key={k}
                              size="small"
                              label={`${k}: ${r.scores[k]}`}
                              variant="outlined"
                              sx={{ borderColor: "rgba(255,255,255,0.1)" }}
                            />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
