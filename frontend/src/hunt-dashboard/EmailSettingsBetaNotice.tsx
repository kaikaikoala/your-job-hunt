import { Box, Button, Typography } from "@mui/material";
import {
  onPrimaryFixedVariant,
  primary,
  primaryFixed,
  surfaceContainerLowest,
} from "../colors";

const onPrimary = surfaceContainerLowest;

export default function EmailSettingsBetaNotice() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        bgcolor: onPrimaryFixedVariant,
        color: onPrimary,
        p: { xs: 3, md: 4 },
        boxShadow: `0 4px 24px ${onPrimaryFixedVariant}40`,
        display: "flex",
        alignItems: "center",
        gap: 3,
        mt: 4,
      }}
    >
      {/* gradient overlay */}
      <Box
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 256,
          height: "100%",
          background: `linear-gradient(to left, ${primaryFixed}33, transparent)`,
          pointerEvents: "none",
        }}
      />

      {/* icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          bgcolor: `${onPrimary}1A`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, fontVariationSettings: '"FILL" 1' }}
        >
          verified
        </span>
      </Box>

      {/* text */}
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: onPrimary,
            mb: 0.5,
          }}
        >
          Email Sync is in Private Beta
        </Typography>
        <Typography
          sx={{ fontSize: 14, color: `${onPrimary}CC`, fontWeight: 500 }}
        >
          Please contact the developer to be added to the allow list for
          automated job application tracking.
        </Typography>
      </Box>

      {/* CTA */}
      <Button
        variant="contained"
        component="a"
        href="mailto:kaishinpk@gmail.com"
        sx={{
          ml: "auto",
          flexShrink: 0,
          bgcolor: surfaceContainerLowest,
          color: primary,
          fontSize: 13,
          py: 1.25,
          whiteSpace: "nowrap",
          boxShadow: "none",
          "&:hover": { bgcolor: primaryFixed, boxShadow: "none" },
        }}
      >
        Request Access
      </Button>
    </Box>
  );
}
