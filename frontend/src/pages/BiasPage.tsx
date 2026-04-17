import {
  Box, Grid, Alert, Chip, Typography, Stack, Accordion,
  AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import WarningIcon from "@mui/icons-material/WarningRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import RunButton from "../components/RunButton";
import ProgressPanel from "../components/ProgressPanel";
import { useStreamedRun } from "../hooks/useStreamedRun";
import type { BiasResponse } from "../api";

const COLORS = ["#7C4DFF", "#00E5FF", "#00E676", "#FFB300", "#FF5252", "#B388FF"];

export default function BiasPage() {
  const { loading, progress, result: data, error, run } = useStreamedRun<BiasResponse>("/api/bias/stream");

  return (
    <Box>
      <PageHeader
        icon={<BalanceRoundedIcon />}
        title="Bias Audit"
        subtitle="Swap demographic identities in prompts · measure sentiment delta across groups."
        part="Part 2.5"
        right={<RunButton onClick={() => run({})} loading={loading} label="Run Audit" />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <ProgressPanel loading={loading} progress={progress} />
      {!data && !loading && (
        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          Runs prompts with different names/demographics and measures variance in sentiment scores.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Templates" value={data.summary.total_templates} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Clean" value={data.summary.clean} accent="success" icon={<CheckCircleIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Biased" value={data.summary.biased} accent="error" icon={<WarningIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Bias Rate"
                value={`${data.summary.bias_rate.toFixed(0)}%`}
                accent={data.summary.bias_rate > 0 ? "error" : "success"}
              />
            </Grid>
          </Grid>

          <Stack spacing={3}>
            {data.analyses.map((a, i) => {
              const scores = Object.entries(a.demographic_scores).map(([k, v]) => ({
                demographic: k, sentiment: Number(v),
              }));
              const max = Math.max(...scores.map((s) => s.sentiment));
              const min = Math.min(...scores.map((s) => s.sentiment));
              return (
                <SectionCard
                  key={i}
                  title={a.template_name}
                  subtitle={a.category}
                  action={
                    <Chip
                      label={a.bias_detected ? "BIAS DETECTED" : "CLEAN"}
                      color={a.bias_detected ? "error" : "success"}
                      variant="outlined"
                      size="small"
                    />
                  }
                >
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Box sx={{ height: 260 }}>
                        <ResponsiveContainer>
                          <BarChart data={scores}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="demographic" tick={{ fill: "#9AA0B2", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#9AA0B2", fontSize: 11 }} domain={[-1, 1]} />
                            <Tooltip
                              contentStyle={{
                                background: "#12151F",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 8,
                              }}
                            />
                            <Bar dataKey="sentiment" radius={[6, 6, 0, 0]} fill={COLORS[i % COLORS.length]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)" }}>
                          <Typography variant="overline" color="text.secondary">Variance</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {a.bias_score.toFixed(4)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            threshold: 0.1
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)" }}>
                          <Typography variant="overline" color="text.secondary">Delta (max − min)</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {(max - min).toFixed(3)}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: a.bias_detected ? "rgba(255,82,82,0.06)" : "rgba(0,230,118,0.06)" }}>
                          <Typography variant="overline" color="text.secondary">Direction</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {a.bias_direction}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={12}>
                      <Accordion
                        disableGutters
                        sx={{
                          bgcolor: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 2,
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                          <Typography variant="body2" color="text.secondary">
                            View raw responses per identity
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1}>
                            {Object.entries(a.responses_by_identity).map(([k, v]) => (
                              <Box key={k} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                                <Chip
                                  size="small"
                                  label={k}
                                  sx={{ minWidth: 150, bgcolor: "rgba(124,77,255,0.1)" }}
                                />
                                <Typography variant="body2" sx={{ flex: 1 }}>{v}</Typography>
                              </Box>
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  </Grid>
                </SectionCard>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}
