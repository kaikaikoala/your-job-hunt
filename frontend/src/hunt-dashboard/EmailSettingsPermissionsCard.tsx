import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEmailSettings } from "../api/emailSettings";
import {
  onPrimaryFixedVariant,
  onSurface,
  onSurfaceVariant,
  success,
  successDark,
  surfaceContainerLowest,
} from "../colors";
import { sectionSx } from "../shared/styles";

interface Props {
  label?: string;
}

export default function EmailSettingsPermissionsCard({
  label: initialLabel,
}: Props) {
  const [label, setLabel] = useState(initialLabel ?? "");
  const queryClient = useQueryClient();

  useEffect(() => {
    setLabel(initialLabel ?? "");
  }, [initialLabel]);

  const mutation = useMutation({
    mutationFn: () => updateEmailSettings(label),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["emailSettings"] }),
  });

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <Typography variant="h2" sx={{ color: onSurface }}>
          Email Parsing Scope
        </Typography>
        {label ? (
          <Chip
            label={`Scope: ${label}`}
            size="small"
            sx={{
              bgcolor: `${success}26`,
              color: successDark,
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        ) : (
          <Chip
            label="Scope: None"
            size="small"
            sx={{
              bgcolor: "#FEF3C7",
              color: "#B45309",
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        )}
      </Box>
      <Typography variant="body2" sx={{ color: onSurfaceVariant, mb: 4 }}>
        Limit the AI assistant to only scan emails with a specific Gmail label
        to protect your privacy. Leave blank to scan all emails.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <TextField
          label="Restricted Label"
          placeholder="e.g. Job Hunt"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          sx={{ flexShrink: 0, height: 56 }}
        >
          {mutation.isPending ? <CircularProgress size={20} /> : "Save"}
        </Button>
      </Box>
      {mutation.isSuccess && (
        <Typography
          variant="caption"
          sx={{ color: "success.main", mt: 1, display: "block" }}
        >
          Label saved.
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 4 }}>
        {[
          {
            icon: "mail_lock",
            title: "Read Only Access",
            desc: "We only read emails and only store application related data. We never delete or send emails on your behalf.",
          },
          {
            icon: "visibility_off",
            title: "Zero Data Sale",
            desc: "Your data is yours. We never sell your contact list or employment history to third-party advertisers.",
          },
        ].map(({ icon, title, desc }) => (
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
                variant="body2"
                sx={{ fontWeight: 700, color: onSurface, mb: 0.5 }}
              >
                {title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: onSurfaceVariant,
                  lineHeight: 1.6,
                  display: "block",
                }}
              >
                {desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
