import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Paper,
  Typography,
} from "@mui/material";
import { onSurface, onSurfaceVariant } from "../colors";
import { tightCardSx } from "../shared/styles";

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

export default function EmailSecurityFaqCard() {
  return (
    <Paper elevation={0} sx={tightCardSx}>
      <Typography variant="h3" sx={{ color: onSurface, mb: 2 }}>
        Security FAQ
      </Typography>
      {FAQ.map(({ q, a }) => (
        <Accordion
          key={q}
          disableGutters
          elevation={0}
          sx={{ bgcolor: "transparent", "&:before": { display: "none" } }}
        >
          <AccordionSummary
            expandIcon={
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
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
            <Typography variant="caption" sx={{ fontWeight: 600, color: onSurface }}>
              {q}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.5 }}>
            <Typography variant="caption" sx={{ color: onSurfaceVariant, lineHeight: 1.6, display: "block" }}>
              {a}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
}
