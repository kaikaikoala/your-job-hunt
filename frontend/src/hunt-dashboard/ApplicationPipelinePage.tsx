import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/applications";
import ApplicationAddDialog from "./ApplicationAddDialog";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";
import ApplicationSankeyGraph, { computeSankeyLinks } from "./ApplicationSankeyGraph";
import ApplicationList from "./ApplicationList";
import { surface, onSurface, onSurfaceVariant } from "../colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationPipelinePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const applications = data?.applications;
  const sankeyLinks = computeSankeyLinks(applications ?? []);

  const visibleApps = selectedNode
    ? applications?.filter((app) =>
        app.stages.some((s) => s.stage === selectedNode),
      )
    : applications?.filter((app) => app.latestStage?.stage !== "Rejected");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surface }}>
      <NavBar activeLink="hunt-tracker" />

      <Box
        component="main"
        sx={{ pt: "64px", px: 4, pb: 4, maxWidth: 1280, mx: "auto" }}
      >
        {/* Header */}
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
                fontFamily: "Manrope, sans-serif",
                fontWeight: 800,
                color: onSurface,
                mb: 1,
              }}
            >
              The Hunt Dashboard
            </Typography>
            <Typography sx={{ color: onSurfaceVariant, fontSize: 16 }}>
              Your professional journey, curated.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              component={Link}
              to="/emailsettings"
              variant="outlined"
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: "none",
              }}
            >
              Email Sync
            </Button>
            <Button
              variant="contained"
              onClick={() => setDialogOpen(true)}
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1.5,
              }}
            >
              New Application
            </Button>
          </Box>
        </Box>

        {/* Bento grid */}
        <Box
          sx={{
            mb: 4,
          }}
        >
          {/* Sankey hero — 8 col */}
          <Box sx={{ display: { xs: "none", lg: "block" } }}>
            <ApplicationSankeyGraph
              links={sankeyLinks}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
            />
          </Box>
        </Box>

        <ApplicationList
          isLoading={isLoading}
          visibleApps={visibleApps}
          selectedNode={selectedNode}
        />
      </Box>

      <ApplicationAddDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <Footer />
    </Box>
  );
}
