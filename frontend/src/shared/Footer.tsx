import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  surfaceContainerLowest,
  borderFaint,
  onSurface,
  onSurfaceVariant,
  primary,
} from "../colors";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: surfaceContainerLowest,
        borderTop: `1px solid ${borderFaint}`,
        py: 8,
        px: { xs: 4, md: 6 },
      }}
    >
      <Box
        sx={{
          maxWidth: "88rem",
          mx: "auto",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
          <Typography
            sx={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 900,
              fontSize: "1.2rem",
              color: onSurface,
              letterSpacing: "-0.03em",
              mb: 0.5,
            }}
          >
            Your Job Hunt
          </Typography>
          <Typography sx={{ color: onSurfaceVariant, fontSize: "0.875rem" }}>
            © 2025 Your Job Hunt.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 5 }}>
          {[
            { label: "Terms of Service", href: "/tos.md" },
            { label: "Privacy Policy", href: "/privacypolicy.md" },
            { label: "Contact", href: "mailto:kaishinpk@gmail.com" },
          ].map(({ label, href }) => (
            <Typography
              key={label}
              component="a"
              href={href}
              sx={{
                color: onSurfaceVariant,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                "&:hover": { color: primary },
                transition: "color 0.15s",
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
