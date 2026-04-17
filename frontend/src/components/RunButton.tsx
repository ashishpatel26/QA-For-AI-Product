import { Button, CircularProgress } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

interface Props {
  onClick: () => void;
  loading: boolean;
  label?: string;
  disabled?: boolean;
}

export default function RunButton({ onClick, loading, label = "Run Evaluation", disabled }: Props) {
  return (
    <Button
      variant="contained"
      size="large"
      onClick={onClick}
      disabled={loading || disabled}
      startIcon={
        loading ? <CircularProgress size={18} sx={{ color: "inherit" }} /> : <PlayArrowRoundedIcon />
      }
      sx={{ minWidth: 180 }}
    >
      {loading ? "Running..." : label}
    </Button>
  );
}
