import { createTheme, alpha } from "@mui/material/styles";

// Elegant dark Material theme. Indigo/cyan accent, graphite surfaces.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary:   { main: "#7C4DFF", light: "#B388FF", dark: "#5E35B1" },
    secondary: { main: "#00E5FF", light: "#6EFFFF", dark: "#00B8D4" },
    success:   { main: "#00E676" },
    warning:   { main: "#FFB300" },
    error:     { main: "#FF5252" },
    background: {
      default: "#0A0D14",
      paper:   "#12151F",
    },
    divider: "rgba(255,255,255,0.08)",
    text: {
      primary:   "#E8EAF0",
      secondary: "#9AA0B2",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `"Inter", "Roboto", "Segoe UI", system-ui, sans-serif`,
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(1200px 600px at 10% -10%, rgba(124,77,255,0.12), transparent 60%), " +
            "radial-gradient(900px 500px at 110% 10%, rgba(0,229,255,0.08), transparent 60%)",
          backgroundAttachment: "fixed",
        },
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.08)",
          borderRadius: 10,
        },
        "*::-webkit-scrollbar-thumb:hover": {
          background: "rgba(255,255,255,0.18)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(12px)",
          backgroundColor: alpha("#0A0D14", 0.7),
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0C0F18",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: alpha("#12151F", 0.8),
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          "&.MuiButton-containedPrimary": {
            background: "linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)",
            color: "#0A0D14",
            "&:hover": {
              background: "linear-gradient(135deg, #9575FF 0%, #5EEFFF 100%)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 8, borderRadius: 6 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "rgba(255,255,255,0.06)" },
      },
    },
  },
});

export default theme;
