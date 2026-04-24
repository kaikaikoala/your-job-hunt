import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Paper,
  Typography,
} from "@mui/material";
import EmailSettingsConnectionCard from "./EmailSettingsConnectionCard";
import EmailSettingsBetaNotice from "./EmailSettingsBetaNotice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteEmailSettings,
  fetchEmailSettings,
  fetchEmailSync,
  startEmailSync,
} from "../api/emailSettings";
import Footer from "../shared/Footer";
import NavBar from "../shared/NavBar";
import {
  borderSubtle,
  dark,
  onPrimaryFixedVariant,
  onSurface,
  onSurfaceVariant,
  primary,
  primaryFixed,
  success,
  successDark,
  surface,
  surfaceContainerLow,
  surfaceContainerLowest,
} from "../colors";

const SYNC_HISTORY = [
  {
    label: "Sync Completed",
    detail: "3 interview invites detected & added",
    time: "Today, 10:42 AM",
  },
  {
    label: "Sync Completed",
    detail: "No updates found in inbox",
    time: "Today, 06:15 AM",
  },
  {
    label: "Sync Completed",
    detail: "1 rejection letter logged & status updated",
    time: "Yesterday, 11:20 PM",
  },
];

const PERMISSIONS = [
  {
    icon: "mail_lock",
    title: "Metadata Access",
    desc: "We only read emails and only store application related data. We never delete or send emails on your behalf.",
  },
  {
    icon: "calendar_today",
    title: "Interview Scheduling",
    desc: "Automatic extraction of dates and times for upcoming interviews to populate your dashboard calendar.",
  },
  {
    icon: "smart_toy",
    title: "AI Processing",
    desc: "Let our AI track your job hunt so you can focus on interviews and growing your skills.",
  },
  {
    icon: "visibility_off",
    title: "Zero Data Sale",
    desc: "Your data is yours. We never sell your contact list or employment history to third-party advertisers.",
  },
];

const FAQ = [
  {
    q: "Is my password stored?",
    a: "No. We use OAuth 2.0. Your Job Hunt never sees or stores your Google password.",
  },
  {
    q: "Can I revoke access?",
    a: "Absolutely. You can revoke our token at any time through this dashboard or your Google Security settings.",
  },
  {
    q: "Data Encryption",
    a: "All data is encrypted in transit and at rest using AES-256 protocols.",
  },
];

export default function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);

  const { data: emailSettings } = useQuery({
    queryKey: ["emailSettings"],
    queryFn: fetchEmailSettings,
  });

  const { data: syncStatus } = useQuery({
    queryKey: ["emailSync", activeSyncId],
    queryFn: () => fetchEmailSync(activeSyncId!),
    enabled: activeSyncId !== null,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
  });

  useEffect(() => {
    if (syncStatus && syncStatus.status !== "running") {
      setActiveSyncId(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }, [syncStatus, queryClient]);

  const disconnectMutation = useMutation({
    mutationFn: deleteEmailSettings,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emailSettings"] }),
  });

  const isSyncing = activeSyncId !== null;
  const isConnected = emailSettings != null;

  const handleSync = async () => {
    try {
      const { syncId } = await startEmailSync();
      setActiveSyncId(syncId);
    } catch {
      // no-op — TODO: surface error state
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surface }}>
      <NavBar />

      <Box
        component="main"
        sx={{
          pt: "64px",
          px: { xs: 3, md: 6 },
          pb: 4,
          maxWidth: 1280,
          mx: "auto",
        }}
      >
        <EmailSettingsBetaNotice />

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            pt: 6,
            mb: 6,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { md: "flex-end" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box sx={{ maxWidth: 560 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: onSurface,
                letterSpacing: "-0.02em",
                mb: 1.5,
              }}
            >
              Email Synchronization
            </Typography>
            <Typography
              sx={{ color: onSurfaceVariant, fontSize: 17, lineHeight: 1.6 }}
            >
              Streamline your job search by automatically syncing interview
              invites and application updates directly from your inbox.
            </Typography>
          </Box>
          <Chip
            icon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, fontVariationSettings: '"FILL" 1' }}
              >
                verified_user
              </span>
            }
            label="Enterprise Security"
            sx={{
              bgcolor: `${successDark}1A`,
              color: successDark,
              fontWeight: 700,
              fontSize: 13,
              height: 36,
              px: 1,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
        </Box>

        {/* ── Row 1: Connection + Stats ───────────────────────────────────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" },
            gap: 3,
            mb: 3,
          }}
        >
          {/* Connection Card */}
          <EmailSettingsConnectionCard
            isConnected={isConnected}
            connectedEmail={emailSettings?.email}
            isSyncing={isSyncing}
            isDisconnecting={disconnectMutation.isPending}
            onSync={handleSync}
            onDisconnect={() => disconnectMutation.mutate()}
          />

          {/* Stats Card */}
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
                sx={{
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: primaryFixed,
                  mb: 4,
                }}
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
                  <Typography sx={{ color: `${primaryFixed}B3`, fontSize: 13 }}>
                    Applications updated this month
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Manrope, sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#fff",
                      mb: 0.5,
                    }}
                  >
                    Last Sync
                  </Typography>
                  <Typography sx={{ color: `${primaryFixed}B3`, fontSize: 13 }}>
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
              <Box
                sx={{
                  position: "relative",
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                }}
              >
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
                  sx={{
                    position: "relative",
                    width: 12,
                    height: 12,
                    bgcolor: success,
                    borderRadius: "50%",
                  }}
                />
              </Box>
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: success }}
              >
                System actively monitoring inbox
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* ── Row 2: Permissions + FAQ ────────────────────────────────────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "8fr 4fr" },
            gap: 3,
            mb: 3,
          }}
        >
          {/* Permissions */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              bgcolor: surfaceContainerLow,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: onSurface,
                mb: 4,
              }}
            >
              Sync Permissions & Scope
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 4,
              }}
            >
              {PERMISSIONS.map(({ icon, title, desc }) => (
                <Box key={title} sx={{ display: "flex", gap: 2 }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: surfaceContainerLowest,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ color: onPrimaryFixedVariant }}
                    >
                      {icon}
                    </span>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: onSurface,
                        mb: 0.5,
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: onSurfaceVariant,
                        lineHeight: 1.6,
                      }}
                    >
                      {desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* FAQ + Help */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${borderSubtle}`,
              }}
            >
              <Typography
                sx={{ fontWeight: 700, fontSize: 17, color: onSurface, mb: 2 }}
              >
                Security FAQ
              </Typography>
              {FAQ.map(({ q, a }) => (
                <Accordion
                  key={q}
                  disableGutters
                  elevation={0}
                  sx={{
                    bgcolor: "transparent",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        expand_more
                      </span>
                    }
                    sx={{
                      px: 0,
                      py: 0.5,
                      minHeight: "unset",
                      "& .MuiAccordionSummary-content": { my: 1 },
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 600, fontSize: 13, color: onSurface }}
                    >
                      {q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.5 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: onSurfaceVariant,
                        lineHeight: 1.6,
                      }}
                    >
                      {a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>

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
                <Typography
                  sx={{
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#fff",
                    mb: 1,
                  }}
                >
                  Need Help?
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.6,
                    mb: 2.5,
                  }}
                >
                  Our security team is available 24/7 for privacy concerns.
                </Typography>
                <Box
                  component="a"
                  href="#"
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
                  Contact Security Support
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                  >
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
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 96 }}
                >
                  security
                </span>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* ── Sync History ────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: `1px solid ${borderSubtle}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: onSurface,
              }}
            >
              Sync History
            </Typography>
            <Button
              variant="text"
              sx={{ fontSize: 13, color: onPrimaryFixedVariant }}
            >
              Export Log
            </Button>
          </Box>
          <Box>
            {SYNC_HISTORY.map(({ label, detail, time }, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 2.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: successDark,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: 14, color: onSurface }}
                    >
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: onSurfaceVariant }}>
                      {detail}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: onSurface,
                    flexShrink: 0,
                    ml: 2,
                  }}
                >
                  {time}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* ── Floating AI chip ────────────────────────────────────────────────── */}
      <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 50 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: success,
            color: successDark,
            px: 3,
            py: 1.5,
            borderRadius: "999px",
            boxShadow: "0 8px 24px rgba(25,28,30,0.12)",
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: '"FILL" 1', fontSize: 20 }}
          >
            auto_awesome
          </span>
          AI Insights Active
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
