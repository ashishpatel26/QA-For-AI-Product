import { Card, CardContent, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}

export default function SectionCard({ title, subtitle, action, children, dense }: Props) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: dense ? 2 : 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
