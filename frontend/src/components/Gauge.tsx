import { Box, Typography } from "@mui/material";

interface Props {
  value: number; // 0-100
  label: string;
  size?: number;
  caption?: string;
  colorOverride?: string;
}

function gaugeColor(v: number) {
  if (v >= 80) return "#00E676";
  if (v >= 60) return "#FFB300";
  return "#FF5252";
}

export default function Gauge({ value, label, size = 160, caption, colorOverride }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = colorOverride ?? gaugeColor(clamped);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id={`g-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#g-${label})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h4" sx={{ color, fontWeight: 700 }}>
            {clamped.toFixed(0)}
            <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 0.3 }}>
              %
            </Typography>
          </Typography>
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}
