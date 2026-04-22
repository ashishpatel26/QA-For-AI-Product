import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CircleIcon from "@mui/icons-material/Circle";
import { Link, Outlet, useLocation } from "react-router-dom";
import { api, type HealthResponse } from "../api";
import ModelSelector from "../components/ModelSelector";

const NAV = [
  { path: "/",            label: "Overview",     icon: <DashboardRoundedIcon /> },
  { path: "/eval",        label: "Eval Runner",  icon: <ScienceRoundedIcon />,   tag: "2.2" },
  { path: "/judge",       label: "LLM Judge",    icon: <GavelRoundedIcon />,     tag: "5.3" },
  { path: "/adversarial", label: "Adversarial",  icon: <ShieldRoundedIcon />,    tag: "2.3/4" },
  { path: "/rag",         label: "RAG Triad",    icon: <HubRoundedIcon />,       tag: "5.1" },
  { path: "/bias",        label: "Bias Audit",   icon: <BalanceRoundedIcon />,   tag: "2.5" },
  { path: "/consistency", label: "Consistency",  icon: <LoopRoundedIcon />,      tag: "2.3" },
];

const DRAWER_W = 260;

export default function AppShell() {
  const location = useLocation();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    api.get<HealthResponse>("/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth(null));
    const id = setInterval(() => {
      api.get<HealthResponse>("/health")
        .then((r) => setHealth(r.data))
        .catch(() => setHealth(null));
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  const online = !!(health?.ollama_reachable || health?.openrouter_configured);
  const isOpenRouter = health?.active_provider === "openrouter";
  const [userSelectedModel, setUserSelectedModel] = useState<string | null>(null);
  const activeModel = userSelectedModel ?? health?.openrouter_model ?? "openai/gpt-4o-mini";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: "linear-gradient(135deg, #7C4DFF, #00E5FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🧪
          </Box>
          <Typography variant="h6" sx={{ flexGrow: 0 }}>
            AI QA Console
          </Typography>
          <Chip
            label="Production AI Quality Stack"
            size="small"
            variant="outlined"
            sx={{ borderColor: "rgba(255,255,255,0.12)", color: "text.secondary" }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip
            title={
              health
                ? isOpenRouter
                  ? `OpenRouter · ${health.openrouter_model}`
                  : `${health.ollama_host} · ${health.ollama_model}`
                : "Provider status unknown"
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircleIcon
                sx={{
                  fontSize: 10,
                  color: online ? "success.main" : "error.main",
                  filter: online ? "drop-shadow(0 0 6px #00E676)" : undefined,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {online
                  ? isOpenRouter
                    ? `OpenRouter (${health?.openrouter_model ?? ""})`
                    : health?.ollama_model ?? "online"
                  : "offline"}
              </Typography>
            </Box>
          </Tooltip>
          <IconButton
            size="small"
            component="a"
            href="/docs"
            target="_blank"
            sx={{ color: "text.secondary" }}
          >
            <Typography variant="caption">API</Typography>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_W,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_W, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
            Demos
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {NAV.map((n) => {
            const active = location.pathname === n.path;
            return (
              <ListItemButton
                key={n.path}
                component={Link}
                to={n.path}
                selected={active}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    background:
                      "linear-gradient(90deg, rgba(124,77,255,0.18), rgba(0,229,255,0.08))",
                    borderLeft: "3px solid #7C4DFF",
                    pl: 1.6,
                  },
                  "&:hover": { background: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? "primary.light" : "text.secondary" }}>
                  {n.icon}
                </ListItemIcon>
                <ListItemText
                  primary={n.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: active ? 600 : 500,
                        color: active ? "text.primary" : "text.secondary",
                      },
                    },
                  }}
                />
                {n.tag && (
                  <Chip
                    label={n.tag}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      bgcolor: "rgba(255,255,255,0.04)",
                      color: "text.secondary",
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.04)" }} />

        {health?.openrouter_configured && (
          <ModelSelector
            currentModel={activeModel}
            onModelChange={setUserSelectedModel}
          />
        )}

        <Box sx={{ px: 3, pb: 3, mt: "auto" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {isOpenRouter ? "OpenRouter" : "Ollama"}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            {isOpenRouter ? activeModel : health?.ollama_model ?? "—"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isOpenRouter ? "cloud · openrouter.ai" : health?.ollama_host ?? ""}
          </Typography>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
