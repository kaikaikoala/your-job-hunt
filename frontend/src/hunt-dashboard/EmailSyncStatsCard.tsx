import { Box, Paper, Typography } from "@mui/material";
import { dark, primary, primaryFixed, success } from "../colors";

export default function EmailSyncStatsCard() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        bgcolor: dark.surface,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -64,
          right: -64,
          width: 192,
          height: 192,
          bgcolor: `${primary}33`,
          borderRadius: "50%",
          filter: "blur(48px)",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative" }}>
        <Typography
          variant="overline"
          sx={{ color: primaryFixed, mb: 4, display: "block", letterSpacing: "0.1em" }}
        >
          Real-time Activity
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Box>
            <Typography
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 900,
                fontSize: 40,
                color: "#fff",
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              142
            </Typography>
            <Typography variant="caption" sx={{ color: `${primaryFixed}B3` }}>
              Applications updated this month
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: "#fff", mb: 0.5 }}>
              Last Sync
            </Typography>
            <Typography variant="caption" sx={{ color: `${primaryFixed}B3` }}>
              Today at 10:42 AM
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mt: 4,
          position: "relative",
        }}
      >
        <Box sx={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: success,
              borderRadius: "50%",
              "@keyframes ping": {
                "0%": { transform: "scale(1)", opacity: 0.75 },
                "75%, 100%": { transform: "scale(2)", opacity: 0 },
              },
              animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <Box
            sx={{ position: "relative", width: 12, height: 12, bgcolor: success, borderRadius: "50%" }}
          />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: success }}>
          System actively monitoring inbox
        </Typography>
      </Box>
    </Paper>
  );
}
