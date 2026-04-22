import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
  keyframes,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import type { ProgressEvent } from "../hooks/useStreamedRun";

interface Props {
  loading: boolean;
  progress: ProgressEvent | null;
  modelLabel?: string;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.55; }
`;

function useElapsed(running: boolean) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const id = setInterval(() => setMs(Date.now() - start), 250);
    return () => { clearInterval(id); setMs(0); };
  }, [running]);
  return ms;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default function ProgressPanel({ loading, progress, modelLabel = "gemma3:4b" }: Props) {
  const elapsed = useElapsed(loading);

  if (!loading) return null;

  const pct = progress ? (progress.step / progress.total) * 100 : null;
  const indeterminate = pct === null;

  return (
    <Card
      sx={{
        mb: 3,
        border: "1px solid rgba(124,77,255,0.35)",
        background: `linear-gradient(135deg,
          ${alpha("#7C4DFF", 0.1)} 0%,
          ${alpha("#00E5FF", 0.06)} 100%)`,
        backdropFilter: "blur(8px)",
        overflow: "visible",
        position: "relative",
      }}
    >
      {/* glow strip on top edge */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 2,
          borderRadius: 1,
          background: "linear-gradient(90deg, transparent, #7C4DFF, #00E5FF, transparent)",
          animation: `${pulse} 2s ease-in-out infinite`,
        }}
      />

      <CardContent sx={{ py: 3, px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2.5 }}>
          {/* spinning icon */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, rgba(124,77,255,0.2), rgba(0,229,255,0.1))",
              border: "1px solid rgba(124,77,255,0.3)",
              flexShrink: 0,
              mt: 0.3,
            }}
          >
            <AutorenewRoundedIcon
              sx={{
                color: "primary.light",
                fontSize: 22,
                animation: `${spin} 1.4s linear infinite`,
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Running evaluation…
              </Typography>
              <Chip
                icon={<BoltRoundedIcon sx={{ fontSize: 14 }} />}
                label={modelLabel}
                size="small"
                sx={{
                  bgcolor: "rgba(0,229,255,0.08)",
                  color: "secondary.light",
                  border: "1px solid rgba(0,229,255,0.2)",
                  fontWeight: 600,
                  height: 24,
                }}
              />
              <Chip
                label={fmt(elapsed)}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.04)",
                  color: "text.secondary",
                  height: 24,
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </Box>

            {/* current label */}
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                animation: `${pulse} 1.8s ease-in-out infinite`,
              }}
            >
              {progress?.label ?? "Initialising…"}
            </Typography>
          </Box>

          {/* step counter */}
          {progress && (
            <Box
              sx={{
                textAlign: "center",
                minWidth: 64,
                flexShrink: 0,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #7C4DFF, #00E5FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1,
                }}
              >
                {progress.step}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                of {progress.total}
              </Typography>
            </Box>
          )}
        </Box>

        {/* progress bar */}
        {indeterminate ? (
          <LinearProgress
            sx={{
              borderRadius: 4,
              height: 6,
              bgcolor: "rgba(255,255,255,0.06)",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #7C4DFF, #00E5FF)",
              },
            }}
          />
        ) : (
          <Box>
            <LinearProgress
              variant="determinate"
              value={pct!}
              sx={{
                borderRadius: 4,
                height: 6,
                bgcolor: "rgba(255,255,255,0.06)",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #7C4DFF, #00E5FF)",
                  transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {pct!.toFixed(0)}% complete
              </Typography>
              {progress && progress.total > 1 && elapsed > 1000 && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {(() => {
                    const msPerStep = elapsed / progress.step;
                    const remaining = (progress.total - progress.step) * msPerStep;
                    return `~${fmt(remaining)} left`;
                  })()}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
