import {
  Box, Grid, Alert, Chip, Typography, Stack, Accordion,
  AccordionSummary, AccordionDetails, Tooltip,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import WarningIcon from "@mui/icons-material/WarningRounded";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import RunButton from "../components/RunButton";
import Gauge from "../components/Gauge";
import ProgressPanel from "../components/ProgressPanel";
import { useStreamedRun } from "../hooks/useStreamedRun";
import type { AdversarialResponse } from "../api";

function heatColor(rate: number) {
  // 0 = red, 50 = amber, 100 = green
  const r = rate / 100;
  const g = Math.round(255 * r);
  const red = Math.round(255 * (1 - r));
  return `rgba(${red}, ${g}, 90, 0.85)`;
}

export default function AdversarialPage() {
  const { loading, progress, result: data, error, run } = useStreamedRun<AdversarialResponse>("/api/adversarial/stream");

  return (
    <Box>
      <PageHeader
        icon={<ShieldRoundedIcon />}
        title="Adversarial Tests"
        subtitle="13 attack vectors — prompt injection, jailbreak, data exfil, role override, encoding bypass."
        part="Part 2.3 / 4"
        right={<RunButton onClick={() => run({})} loading={loading} label="Run Attack Suite" />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <ProgressPanel loading={loading} progress={progress} />
      {!data && !loading && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3 }}>
          This runs many LLM calls. Expect <b>5–15 minutes</b> with gemma3:4b.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Total Attacks" value={data.summary.total} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Defended"  value={data.summary.passed} accent="success" icon={<CheckCircleIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Broken Through"  value={data.summary.failed} accent="error" icon={<WarningIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Defense Rate" value={`${data.summary.pass_rate.toFixed(0)}%`} accent="secondary" />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionCard title="Overall Defense" subtitle="100% = all attacks refused">
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <Gauge value={data.summary.pass_rate} label="defended" size={200}
                         caption={`${data.summary.passed}/${data.summary.total}`} />
                </Box>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <SectionCard title="Attack-Type Heatmap" subtitle="Defense rate per category">
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 2, pt: 1 }}>
                  {Object.entries(data.summary.by_attack_type).map(([type, s]) => {
                    const rate = (s.passed / s.total) * 100;
                    return (
                      <Tooltip key={type} title={`${s.passed}/${s.total} defended`} arrow>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: `linear-gradient(135deg, ${heatColor(rate)}, rgba(0,0,0,0.2))`,
                            minHeight: 100,
                            transition: "transform 150ms ease",
                            "&:hover": { transform: "translateY(-2px)" },
                          }}
                        >
                          <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1, opacity: 0.9 }}>
                            {type.replace(/_/g, " ")}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {rate.toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {s.passed}/{s.total}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          <SectionCard title="Attack Log" subtitle={`${data.results.length} tests`}>
            <Stack spacing={1}>
              {data.results.map((r, i) => (
                <Accordion
                  key={i}
                  disableGutters
                  sx={{
                    bgcolor: r.passed ? "rgba(0,230,118,0.04)" : "rgba(255,82,82,0.06)",
                    border: `1px solid ${r.passed ? "rgba(0,230,118,0.2)" : "rgba(255,82,82,0.3)"}`,
                    borderRadius: 2,
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                      {r.passed ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <WarningIcon color="error" fontSize="small" />
                      )}
                      <Chip
                        size="small"
                        label={r.attack_type.replace(/_/g, " ")}
                        sx={{ bgcolor: "rgba(255,255,255,0.06)", height: 22, fontSize: 10 }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>{r.name}</Typography>
                      <Chip
                        size="small"
                        label={r.passed ? "DEFENDED" : "BROKEN"}
                        color={r.passed ? "success" : "error"}
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Attack Input</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}>
                          {r.input}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Model Output</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                          {r.output}
                        </Typography>
                        {r.failure_reason && (
                          <Alert severity="error" sx={{ mt: 2 }} variant="outlined">
                            {r.failure_reason}
                          </Alert>
                        )}
                      </Grid>
                      {r.description && (
                        <Grid size={12}>
                          <Typography variant="caption" color="text.secondary">{r.description}</Typography>
                        </Grid>
                      )}
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
