import { Box, Paper, Typography } from "@mui/material";
import { success, successDark } from "../colors";

export default function EmailSecurityHelpCard() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: successDark,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="subtitle1" sx={{ color: "#fff", mb: 1 }}>
          Need Help?
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.6,
            display: "block",
            mb: 2.5,
          }}
        >
          Alert the developer for any privacy concerns.
        </Typography>
        <Box
          component="a"
          href="mailto:kaishinpk@gmail.com"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: 13,
            fontWeight: 700,
            color: success,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Contact developer
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_forward
          </span>
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          right: -16,
          bottom: -16,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 96 }}>
          security
        </span>
      </Box>
    </Paper>
  );
}
