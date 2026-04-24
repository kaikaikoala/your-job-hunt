import { Box, Button, Paper, Typography } from "@mui/material";
import { onPrimaryFixedVariant, onSurface, onSurfaceVariant, successDark } from "../colors";
import { cardSx } from "../shared/styles";

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

export default function EmailSyncHistoryTable() {
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
        <Button variant="text" sx={{ fontSize: 13, color: onPrimaryFixedVariant }}>
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
                <Typography variant="body2" sx={{ fontWeight: 700, color: onSurface }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ color: onSurfaceVariant }}>
                  {detail}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: onSurface, flexShrink: 0, ml: 2 }}
            >
              {time}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
