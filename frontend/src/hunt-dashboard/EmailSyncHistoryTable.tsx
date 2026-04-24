import { useEffect, useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { onPrimaryFixedVariant, onSurface, onSurfaceVariant, successDark, error as errorColor, primary } from "../colors";
import { cardSx } from "../shared/styles";
import { fetchEmailSyncs, startEmailSync, type EmailSyncRecord } from "../api/emailSettings";

function formatSyncTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `Today, ${timeStr}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

function syncStatusColor(status: string): string {
  if (status === "completed") return successDark;
  if (status === "failed") return errorColor;
  return primary;
}

function syncStatusLabel(status: string): string {
  if (status === "completed") return "Sync Completed";
  if (status === "failed") return "Sync Failed";
  return "Sync Running";
}

function syncDetail(sync: EmailSyncRecord): string {
  if (sync.status === "running") return "In progress…";
  if (sync.status === "failed") return sync.errorMessage ?? "An error occurred";
  if (!sync.emailsProcessed) return "No updates found in inbox";
  return `${sync.emailsProcessed} email${sync.emailsProcessed !== 1 ? "s" : ""} processed`;
}

export default function EmailSyncHistoryTable() {
  const [syncs, setSyncs] = useState<EmailSyncRecord[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchEmailSyncs().then(setSyncs).catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await startEmailSync();
      const updated = await fetchEmailSyncs();
      setSyncs(updated);
    } catch {
      // no-op
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Paper elevation={0} sx={cardSx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Typography variant="h2" sx={{ color: onSurface }}>
          Sync History
        </Typography>
        <Button
          variant="text"
          sx={{ fontSize: 13, color: onPrimaryFixedVariant }}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Sync"}
        </Button>
      </Box>
      <Box>
        {syncs.map((sync) => (
          <Box
            key={sync.syncId}
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
                  bgcolor: syncStatusColor(sync.status),
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: onSurface }}>
                  {syncStatusLabel(sync.status)}
                </Typography>
                <Typography variant="body2" sx={{ color: onSurfaceVariant }}>
                  {syncDetail(sync)}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: onSurface, flexShrink: 0, ml: 2 }}
            >
              {formatSyncTime(sync.startedAt)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
