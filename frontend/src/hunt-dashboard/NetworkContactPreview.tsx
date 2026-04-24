import { Link } from "react-router-dom";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchContacts } from "../api/network";
import {
  onSurface,
  onSurfaceVariant,
  primarySubtle,
  primary,
  onPrimaryFixedVariant,
  borderSubtle,
} from "../colors";

export default function NetworkContactPreview() {
  const { data: contacts } = useQuery({
    queryKey: ["network"],
    queryFn: fetchContacts,
  });

  const previewContacts = contacts?.slice(0, 3) ?? [];

  return (
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
  );
}
