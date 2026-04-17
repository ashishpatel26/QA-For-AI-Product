import {
  Box, Grid, Alert, Chip, Table, TableBody, TableCell, TableHead,
  TableRow, LinearProgress, Typography, Stack,
} from "@mui/material";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import CancelIcon from "@mui/icons-material/CancelRounded";
import SpeedIcon from "@mui/icons-material/SpeedRounded";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import RunButton from "../components/RunButton";
import Gauge from "../components/Gauge";
import ProgressPanel from "../components/ProgressPanel";
import { useStreamedRun } from "../hooks/useStreamedRun";
import type { EvalResponse } from "../api";

export default function EvalPage() {
  const { loading, progress, result: data, error, run } = useStreamedRun<EvalResponse>("/api/eval/stream");

  return (
    <Box>
      <PageHeader
        icon={<ScienceRoundedIcon />}
        title="Eval Runner"
        subtitle="Golden-dataset evaluation · keyword-contains scoring · per-tag breakdown."
        part="Part 2.2"
        right={<RunButton onClick={() => run({})} loading={loading} label="Run Eval Suite" />}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <ProgressPanel loading={loading} progress={progress} />

      {!data && !loading && (
        <Alert severity="info" variant="outlined" sx={{ mb: 3, borderColor: "rgba(124,77,255,0.3)" }}>
          Click <b>Run Eval Suite</b> to fire the default golden dataset through the local Ollama model.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Total"   value={data.summary.total} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Passed"  value={data.summary.passed} accent="success" icon={<CheckCircleIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Failed"  value={data.summary.failed} accent="error"   icon={<CancelIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Avg Latency"
                value={`${(data.summary.avg_latency_ms / 1000).toFixed(2)}s`}
                accent="secondary"
                icon={<SpeedIcon />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionCard title="Pass Rate" subtitle="≥80% = deployable">
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <Gauge value={data.summary.pass_rate} label="overall" size={200}
                         caption={`${data.summary.passed}/${data.summary.total}`} />
                </Box>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <SectionCard title="By Tag" subtitle="Pass rate per test category">
                <Stack spacing={2}>
                  {Object.entries(data.summary.tag_stats).map(([tag, s]) => {
                    const rate = (s.passed / s.total) * 100;
                    return (
                      <Box key={tag}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                            {tag}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {s.passed}/{s.total} · {rate.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={rate}
                          sx={{
                            "& .MuiLinearProgress-bar": {
                              background:
                                rate >= 80 ? "linear-gradient(90deg, #00E676, #00B8D4)"
                                : rate >= 50 ? "linear-gradient(90deg, #FFB300, #FF9100)"
                                : "linear-gradient(90deg, #FF5252, #FF1744)",
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

          <SectionCard title="Detailed Results" subtitle={`${data.results.length} test cases`}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Input</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell>Actual</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Latency</TableCell>
                  <TableCell>Tags</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.results.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.passed ? "PASS" : "FAIL"}
                            color={r.passed ? "success" : "error"} variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" noWrap>{r.input}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{r.expected}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" noWrap title={r.actual}>{r.actual}</Typography>
                    </TableCell>
                    <TableCell align="right">{r.score.toFixed(2)}</TableCell>
                    <TableCell align="right">{(r.latency_ms / 1000).toFixed(2)}s</TableCell>
                    <TableCell>
                      {r.tags.map((t) => (
                        <Chip key={t} size="small" label={t} sx={{ mr: 0.5, height: 20, fontSize: 10 }} />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
