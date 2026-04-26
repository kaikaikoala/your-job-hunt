import { Link } from "react-router-dom";
import { Box, Button, Paper, Typography } from "@mui/material";
import { surfaceContainerLowest, primary, success, successDark, dark } from "../colors";

export default function EmailSettingsEnableCTABanner() {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        borderRadius: 3,
        bgcolor: dark.surface,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: { xs: 4, md: 5 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          gap: 4,
        }}
      >
        {/* Left: content */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${success}, ${primary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  color: dark.surface,
                  fontVariationSettings: '"FILL" 1',
                }}
              >
                auto_awesome
              </span>
            </Box>
            <Typography
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 800,
                fontSize: { xs: 20, md: 24 },
                color: surfaceContainerLowest,
                letterSpacing: "-0.02em",
              }}
            >
              Email AI assistant
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 15,
              lineHeight: 1.7,
              mb: 3,
              maxWidth: 480,
            }}
          >
            Grant Gmail access to let our AI agent monitor your application
            updates. We'll automatically update your dashboard milestones
            based on your email correspondence.
          </Typography>

          <Button
            component={Link}
            to="/email-settings"
            variant="contained"
            startIcon={
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                sync
              </span>
            }
            sx={{
              px: 4,
              bgcolor: success,
              color: successDark,
              "&:hover": { bgcolor: success, opacity: 0.85 },
            }}
          >
            Enable Email Sync
          </Button>
        </Box>

        {/* Right: decorative image */}
        <Box
          component="img"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6GB_Cpyfwnj7fZL43omVvbvjiCRqcWSetI2Og9jtbjKgdO2XkzaHn2ZomE_yQqIPnCrucKOwz1b9YEiWh4-hiLW2wAxlQK0fblSGtsx-32ffPBQD6T9j-dR5f7XM3-njMlRStLDayyTjUNnL2DM3K-LobdwSr22ZvZ-8iEvfYKkvK1CBK9gugn8C0SL1qlHGjZWKJVBsrYr5qRkPnZQf5mWfD6LRPckPN1GODCm94gG6MLQP9yan0BkBjfYV2osD6kMq3jN_iol3_"
          alt="AI neural network visualization"
          sx={{
            width: { md: 240 },
            height: { xs: 200, md: 240 },
            objectFit: "cover",
            borderRadius: 3,
            display: { xs: "none", md: "block" },
            flexShrink: 0,
          }}
        />
      </Box>
    </Paper>
  );
}
