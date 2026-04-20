import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import { api, type OpenRouterModel } from "../api";

interface Props {
  currentModel: string;
  onModelChange: (modelId: string) => void;
}

type Status = "idle" | "testing" | "connected" | "error";

interface ModelStatus {
  [modelId: string]: Status;
}

export default function ModelSelector({ currentModel, onModelChange }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<ModelStatus>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<OpenRouterModel[]>("/openrouter/models")
      .then((r) => setModels(r.data))
      .catch(() => setErrorMsg("Failed to load models"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (modelId: string) => {
    setStatuses((s) => ({ ...s, [modelId]: "testing" }));
    try {
      const r = await api.post("/openrouter/select", { model_id: modelId });
      if (r.data.success) {
        setStatuses((s) => ({ ...s, [modelId]: "connected" }));
        onModelChange(modelId);
      } else {
        setStatuses((s) => ({ ...s, [modelId]: "error" }));
      }
    } catch {
      setStatuses((s) => ({ ...s, [modelId]: "error" }));
    }
  };

  const statusIcon = (modelId: string) => {
    const s = statuses[modelId];
    const isActive = modelId === currentModel;
    if (s === "testing") return <CircularProgress size={14} sx={{ color: "secondary.light" }} />;
    if (s === "connected" || (isActive && !s))
      return <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "success.main", filter: "drop-shadow(0 0 4px #00E676)" }} />;
    if (s === "error") return <ErrorRoundedIcon sx={{ fontSize: 16, color: "error.main" }} />;
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.secondary">Loading models…</Typography>
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Typography variant="caption" color="error.main" sx={{ px: 2 }}>
        {errorMsg}
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <CloudRoundedIcon sx={{ fontSize: 14, color: "secondary.light" }} />
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontSize: 10 }}>
          OpenRouter Free Models
        </Typography>
      </Box>
      <List dense disablePadding sx={{ maxHeight: 280, overflowY: "auto",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2 },
      }}>
        {models.map((m) => {
          const isActive = m.id === currentModel;
          const ctx = m.context_length >= 1000
            ? `${Math.round(m.context_length / 1024)}K ctx`
            : `${m.context_length} ctx`;
          return (
            <Tooltip key={m.id} title={m.id} placement="right" arrow>
              <ListItemButton
                onClick={() => handleSelect(m.id)}
                selected={isActive}
                sx={{
                  py: 0.5,
                  px: 2,
                  borderRadius: 1.5,
                  mx: 0.5,
                  mb: 0.25,
                  "&.Mui-selected": {
                    bgcolor: "rgba(0,229,255,0.08)",
                    borderLeft: "2px solid #00E5FF",
                    pl: 1.75,
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemText
                  primary={m.name.replace(" (free)", "").replace("(free)", "").trim()}
                  secondary={ctx}
                  slotProps={{
                    primary: { sx: { fontSize: 12, fontWeight: isActive ? 600 : 400,
                      color: isActive ? "text.primary" : "text.secondary",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
                    secondary: { sx: { fontSize: 10, color: "text.disabled" } },
                  }}
                />
                <Box sx={{ ml: 1, flexShrink: 0 }}>{statusIcon(m.id)}</Box>
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.04)", mt: 1 }} />
    </Box>
  );
}
