import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/applications";
import { fetchContacts } from "../api/network";
import ApplicationAddDialog from "./ApplicationAddDialog";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";
import HuntActionItemsPanel from "./HuntActionItemsPanel";
import {
  surface,
  onSurface,
  onSurfaceVariant,
  surfaceContainerLowest,
  primarySubtle,
  primaryFixed,
  primary,
  onPrimaryFixedVariant,
  success,
  successDark,
  dark,
  borderSubtle,
} from "../colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

const PIPELINE_H = 160;
const PIPELINE_MIN_H = 40;

function pipelineBoxHeight(count: number, max: number): number {
  if (max === 0) return PIPELINE_MIN_H;
  return Math.max(PIPELINE_MIN_H, Math.round(PIPELINE_H * (count / max)));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: contacts } = useQuery({
    queryKey: ["network"],
    queryFn: fetchContacts,
  });

  const allStages = (data?.applications ?? []).flatMap((a) => a.stages);
  const appliedCount = allStages.filter((s) => s.stage === "Applied").length;
  const interviewsCount = allStages.filter(
    (s) => s.stage !== "Applied" && s.stage !== "Offer" && s.stage !== "Rejected",
  ).length;
  const offersCount = allStages.filter((s) => s.stage === "Offer").length;

  const appliedH = PIPELINE_H;
  const interviewsH = pipelineBoxHeight(interviewsCount, appliedCount);
  const offersH = pipelineBoxHeight(offersCount, appliedCount);

  const previewContacts = contacts?.slice(0, 3) ?? [];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surface }}>
      <NavBar activeLink="hunt-tracker" />

      <Box
        component="main"
        sx={{ pt: "64px", px: 4, pb: 4, maxWidth: 1280, mx: "auto" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
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
            <Button component={Link} to="/emailsettings" variant="outlined">
              Email sync
            </Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              New Application
            </Button>
          </Box>
        </Box>

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
          {/* Pipeline card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              border: `1px solid ${borderSubtle}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
              <Box>
                <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 18, color: onSurface }}>
                  Application Pipeline
                </Typography>
                <Typography sx={{ fontSize: 13, color: onSurfaceVariant, mt: 0.5 }}>
                  Real-time conversion flow
                </Typography>
              </Box>
              <Chip
                label="See all"
                size="small"
                clickable
                onClick={() => navigate("/applicationpipeline")}
                sx={{ fontSize: 11, height: 24 }}
              />
            </Box>

            {/* Funnel */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: PIPELINE_H }}>
              {/* Applied */}
              <Box sx={{ flex: 1, height: appliedH, bgcolor: primarySubtle, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${primary}33, transparent)` }} />
                <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 900, fontSize: 28, color: primary, lineHeight: 1, zIndex: 1 }}>
                  {appliedCount}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: onSurfaceVariant, letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5, zIndex: 1 }}>
                  Applied
                </Typography>
              </Box>

              {/* Connector */}
              <Box sx={{ width: 40, height: appliedH, bgcolor: `${primary}0D`, clipPath: "polygon(0 20%, 100% 40%, 100% 60%, 0 80%)", flexShrink: 0 }} />

              {/* Interviews */}
              <Box sx={{ flex: 1, height: interviewsH, bgcolor: primaryFixed, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${primary}33, transparent)` }} />
                <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 900, fontSize: 24, color: onPrimaryFixedVariant, lineHeight: 1, zIndex: 1 }}>
                  {interviewsCount}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: onSurfaceVariant, letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5, zIndex: 1 }}>
                  Interviews
                </Typography>
              </Box>

              {/* Connector */}
              <Box sx={{ width: 40, height: interviewsH, bgcolor: `${success}0D`, clipPath: "polygon(0 30%, 100% 45%, 100% 55%, 0 70%)", flexShrink: 0 }} />

              {/* Offers */}
              <Box sx={{ flex: 1, height: offersH, bgcolor: `${success}26`, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${success}33, transparent)` }} />
                <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 900, fontSize: 20, color: successDark, lineHeight: 1, zIndex: 1 }}>
                  {offersCount}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: onSurfaceVariant, letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5, zIndex: 1 }}>
                  Offers
                </Typography>
              </Box>
            </Box>

            {/* Decorative blur orb */}
            <Box sx={{ position: "absolute", right: -80, bottom: -80, width: 256, height: 256, bgcolor: `${primary}08`, borderRadius: "50%", filter: "blur(48px)" }} />
          </Paper>

          <HuntActionItemsPanel />
        </Box>

        {/* ── Email AI assistant ─────────────────────────────────────────── */}
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
                to="/emailsettings"
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

        {/* ── Network preview ─────────────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              px: 0.5,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: onSurface,
                letterSpacing: "-0.02em",
              }}
            >
              Network
            </Typography>
            <Box
              component={Link}
              to="/network"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: 14,
                fontWeight: 700,
                color: onPrimaryFixedVariant,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View All
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Box>
          </Box>

          {previewContacts.length === 0 ? (
            <Typography
              sx={{
                color: onSurfaceVariant,
                fontSize: 14,
                textAlign: "center",
                py: 4,
              }}
            >
              No contacts yet. Add contacts from the{" "}
              <Box
                component={Link}
                to="/network"
                sx={{ color: onPrimaryFixedVariant, fontWeight: 700, textDecoration: "none" }}
              >
                Network page
              </Box>
              .
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {previewContacts.map((contact) => (
                <Paper
                  key={contact.referrerId}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `1px solid ${borderSubtle}`,
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 3 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: onSurface,
                      }}
                    >
                      {contact.name}
                    </Typography>
                    {contact.type && (
                      <Chip
                        label={contact.type}
                        size="small"
                        sx={{
                          bgcolor: primarySubtle,
                          color: primary,
                          fontWeight: 700,
                          fontSize: 10,
                          height: 22,
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </Box>
                  {contact.linkedAppCount > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, color: onSurfaceVariant }}
                      >
                        link
                      </span>
                      <Typography sx={{ fontSize: 12, color: onSurfaceVariant }}>
                        {contact.linkedAppCount} linked{" "}
                        {contact.linkedAppCount === 1 ? "application" : "applications"}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <ApplicationAddDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <Footer />
    </Box>
  );
}
