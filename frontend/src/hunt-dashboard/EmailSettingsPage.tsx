import { useEffect, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import EmailSettingsConnectionCard from "./EmailSettingsConnectionCard";
import EmailSettingsBetaNotice from "./EmailSettingsBetaNotice";
import EmailSyncStatsCard from "./EmailSyncStatsCard";
import EmailSettingsPermissionsCard from "./EmailSettingsPermissionsCard";
import EmailSecurityFaqCard from "./EmailSecurityFaqCard";
import EmailSecurityHelpCard from "./EmailSecurityHelpCard";
import EmailSyncHistoryTable from "./EmailSyncHistoryTable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteEmailSettings,
  fetchEmailSettings,
  fetchEmailSync,
  startEmailSync,
} from "../api/emailSettings";
import Footer from "../shared/Footer";
import NavBar from "../shared/NavBar";
import { onSurface, onSurfaceVariant, successDark, surface } from "../colors";

function Header() {
  return (
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
        <Typography variant="h1" sx={{ fontWeight: 800, color: onSurface, mb: 1.5 }}>
          Email Synchronization
        </Typography>
        <Typography variant="body1" sx={{ color: onSurfaceVariant }}>
          Streamline your job search by automatically syncing interview invites
          and application updates directly from your inbox.
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
  );
}

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

        <Header />

        {/* ── Row 1: Connection + Stats ───────────────────────────────────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" },
            gap: 3,
            mb: 3,
          }}
        >
          <EmailSettingsConnectionCard
            isConnected={isConnected}
            connectedEmail={emailSettings?.email}
            isSyncing={isSyncing}
            isDisconnecting={disconnectMutation.isPending}
            onSync={handleSync}
            onDisconnect={() => disconnectMutation.mutate()}
          />
          <EmailSyncStatsCard />
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
          <EmailSettingsPermissionsCard />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <EmailSecurityFaqCard />
            <EmailSecurityHelpCard />
          </Box>
        </Box>

        {/* ── Sync History ────────────────────────────────────────────────────── */}
        <EmailSyncHistoryTable />
      </Box>

      <Footer />
    </Box>
  );
}
