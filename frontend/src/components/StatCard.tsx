import { Card, CardContent, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  accent?: "primary" | "success" | "warning" | "error" | "secondary";
  icon?: ReactNode;
  caption?: string;
}

const accentMap = {
  primary:   "#7C4DFF",
  secondary: "#00E5FF",
  success:   "#00E676",
  warning:   "#FFB300",
  error:     "#FF5252",
};

export default function StatCard({ label, value, accent = "primary", icon, caption }: Props) {
  const color = accentMap[accent];
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
            {label}
          </Typography>
          {icon && (
            <Box sx={{ color, opacity: 0.85, display: "flex" }}>{icon}</Box>
          )}
        </Box>
        <Typography
          variant="h3"
          sx={{
            mt: 1,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
