import { Box, Typography, Chip } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  subtitle: string;
  part?: string;
  right?: ReactNode;
}

export default function PageHeader({ icon, title, subtitle, part, right }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, rgba(124,77,255,0.18), rgba(0,229,255,0.12))",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "primary.light",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h4">{title}</Typography>
            {part && (
              <Chip
                label={part}
                size="small"
                sx={{
                  bgcolor: "rgba(124,77,255,0.15)",
                  color: "primary.light",
                  border: "1px solid rgba(124,77,255,0.3)",
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
      {right}
    </Box>
  );
}
