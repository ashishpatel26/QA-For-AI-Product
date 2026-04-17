import { Box, Card, CardActionArea, CardContent, Chip, Grid, Typography } from "@mui/material";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";

const CARDS = [
  { to: "/eval",        title: "Eval Runner",  part: "Part 2.2",   desc: "Golden dataset — exact, partial, semantic scoring with tag breakdown.",    icon: <ScienceRoundedIcon fontSize="large" />,  color: "#7C4DFF" },
  { to: "/judge",       title: "LLM Judge",    part: "Part 5.3",   desc: "LLM-as-a-Judge. 5 criteria — accuracy, relevance, clarity, completeness, safety.", icon: <GavelRoundedIcon fontSize="large" />,   color: "#00E5FF" },
  { to: "/adversarial", title: "Adversarial",  part: "Part 2.3/4", desc: "13 attacks — prompt injection, jailbreak, data exfil, role override.",     icon: <ShieldRoundedIcon fontSize="large" />,  color: "#FF5252" },
  { to: "/rag",         title: "RAG Triad",    part: "Part 5.1",   desc: "Context Relevance · Groundedness · Answer Relevance.",                     icon: <HubRoundedIcon fontSize="large" />,     color: "#00E676" },
  { to: "/bias",        title: "Bias Audit",   part: "Part 2.5",   desc: "Demographic bias via identity swaps + sentiment delta.",                   icon: <BalanceRoundedIcon fontSize="large" />, color: "#FFB300" },
  { to: "/consistency", title: "Consistency",  part: "Part 2.3",   desc: "Paraphrase consistency — same question, different phrasings.",             icon: <LoopRoundedIcon fontSize="large" />,    color: "#B388FF" },
];

export default function Overview() {
  return (
    <Box>
      <PageHeader
        icon={<DashboardRoundedIcon />}
        title="AI QA Console"
        subtitle="Production AI quality stack — seven runners backed by local Ollama."
      />

      <Grid container spacing={3}>
        {CARDS.map((c) => (
          <Grid key={c.to} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                transition: "transform 180ms ease, border-color 180ms ease",
                "&:hover": { transform: "translateY(-4px)", borderColor: "rgba(124,77,255,0.3)" },
              }}
            >
              <CardActionArea component={Link} to={c.to} sx={{ p: 2.5, height: "100%" }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: c.color,
                        background: `${c.color}22`,
                        border: `1px solid ${c.color}44`,
                      }}
                    >
                      {c.icon}
                    </Box>
                    <Chip
                      label={c.part}
                      size="small"
                      sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "text.secondary" }}
                    />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>{c.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {c.desc}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: c.color }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                      Open
                    </Typography>
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
