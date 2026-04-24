import { Box, Paper, Typography } from "@mui/material";
import { onPrimaryFixedVariant, onSurface, onSurfaceVariant, surfaceContainerLowest } from "../colors";
import { sectionSx } from "../shared/styles";

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

export default function EmailSettingsPermissionsCard() {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="h2" sx={{ color: onSurface, mb: 4 }}>
        Sync Permissions &amp; Scope
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
              <span className="material-symbols-outlined" style={{ color: onPrimaryFixedVariant }}>
                {icon}
              </span>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: onSurface, mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="caption" sx={{ color: onSurfaceVariant, lineHeight: 1.6, display: "block" }}>
                {desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
