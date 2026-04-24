import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ApplicationAddDialog from "./ApplicationAddDialog";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";
import HuntActionItemsPanel from "./HuntActionItemsPanel";
import ApplicationPipelineCard from "./ApplicationPipelineCard";
import EmailSettingsEnableCTABanner from "./EmailSettingsEnableCTABanner";
import NetworkContactPreview from "./NetworkContactPreview";
import EmailSyncButton from "./EmailSyncButton";
import { surface, onSurface, onSurfaceVariant } from "../colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  function renderHeader() {
    return (
      <Box
        sx={{
          mb: 6,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { md: "flex-end" },
          gap: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: onSurface,
              mb: 1,
              letterSpacing: "-0.02em",
            }}
          >
            The Hunt Dashboard
          </Typography>
          <Typography sx={{ color: onSurfaceVariant, fontSize: 16, lineHeight: 1.6 }}>
            Your professional journey, curated. Monitor every application
            milestone and leverage AI to optimize your strategy.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <EmailSyncButton />
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            New Application
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surface }}>
      <NavBar activeLink="hunt-tracker" />

      <Box
        component="main"
        sx={{ pt: "64px", px: 4, pb: 4, maxWidth: 1280, mx: "auto" }}
      >
        {renderHeader()}

        {/* ── Bento grid: Pipeline (8fr) + To-Do (4fr) ──────────────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "8fr 4fr" },
            gap: 3,
            mb: 4,
            alignItems: "stretch",
          }}
        >
          <ApplicationPipelineCard />
          <HuntActionItemsPanel />
        </Box>

        <EmailSettingsEnableCTABanner />
        <NetworkContactPreview />
      </Box>

      <ApplicationAddDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <Footer />
    </Box>
  );
}
