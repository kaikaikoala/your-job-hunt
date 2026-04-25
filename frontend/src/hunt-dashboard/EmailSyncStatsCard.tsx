import { Box, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchEmailSyncs } from "../api/emailSettings";
import { dark, primary, primaryFixed, success, warning } from "../colors";

function formatLastSync(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? `Today at ${time}`
    : `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
}

function StatHighlightWidget({ value, label }: { value: number; label: string }) {
  return (
    <Box>
      <Typography
        variant="h1"
        sx={{ fontWeight: 900, fontSize: 40, color: "#fff", lineHeight: 1, mb: 0.5 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: `${primaryFixed}B3` }}>
        {label}
      </Typography>
    </Box>
  );
}

function LastSyncWidget({
  lastCompletedAt,
  statusColor,
}: {
  lastCompletedAt: string | null;
  statusColor: string;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: "#fff", mb: 0.5 }}>
        Last Sync
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          position: "relative",
        }}
      >
        <Box sx={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: statusColor,
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
              bgcolor: statusColor,
              borderRadius: "50%",
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: statusColor }}>
          {lastCompletedAt ? formatLastSync(lastCompletedAt) : "No syncs yet"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function EmailSyncStatsCard() {
  const { data: syncs = [] } = useQuery({
    queryKey: ["emailSyncs"],
    queryFn: fetchEmailSyncs,
  });

  const totalProcessed = syncs.reduce(
    (sum, s) => sum + (s.emailsProcessed ?? 0),
    0,
  );
  const totalApplicationUpdates = syncs.reduce(
    (sum, s) => sum + (s.applicationUpdates ?? 0),
    0,
  );
  const lastCompletedAt = syncs.find((s) => s.completedAt)?.completedAt ?? null;
  const isRecentSync =
    lastCompletedAt !== null &&
    Date.now() - new Date(lastCompletedAt).getTime() < 24 * 60 * 60 * 1000;
  const statusColor = isRecentSync ? success : warning;

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
          sx={{ color: primaryFixed, mb: 4, display: "block" }}
        >
          Real-time Activity
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <StatHighlightWidget value={totalApplicationUpdates} label="Applications updated" />
          <StatHighlightWidget value={totalProcessed} label="Emails processed" />
          <LastSyncWidget lastCompletedAt={lastCompletedAt} statusColor={statusColor} />
        </Box>
      </Box>
    </Paper>
  );
}
