import { useNavigate } from "react-router-dom";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/applications";
import {
  onSurface,
  onSurfaceVariant,
  primarySubtle,
  primaryFixed,
  primary,
  onPrimaryFixedVariant,
  success,
  successDark,
  borderSubtle,
} from "../colors";

const PIPELINE_H = 160;
const PIPELINE_MIN_H = 40;

function pipelineBoxHeight(count: number, max: number): number {
  if (max === 0) return PIPELINE_MIN_H;
  return Math.max(PIPELINE_MIN_H, Math.round(PIPELINE_H * (count / max)));
}

export default function ApplicationPipelineCard() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const allStages = (data?.applications ?? []).flatMap((a) => a.stages);
  const appliedCount = allStages.filter((s) => s.stage === "Applied").length;
  const interviewsCount = allStages.filter(
    (s) => s.stage !== "Applied" && s.stage !== "Offer" && s.stage !== "Rejected",
  ).length;
  const offersCount = allStages.filter((s) => s.stage === "Offer").length;

  const appliedH = PIPELINE_H;
  const interviewsH = pipelineBoxHeight(interviewsCount, appliedCount);
  const offersH = pipelineBoxHeight(offersCount, appliedCount);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        border: `1px solid ${borderSubtle}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 18, color: onSurface }}>
            Application Pipeline
          </Typography>
          <Typography sx={{ fontSize: 13, color: onSurfaceVariant, mt: 0.5 }}>
            Real-time conversion flow
          </Typography>
        </Box>
        <Chip
          label="See all"
          size="small"
          clickable
          onClick={() => navigate("/application-pipeline")}
          sx={{ fontSize: 11, height: 24 }}
        />
      </Box>

      {/* Funnel */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: PIPELINE_H }}>
        {/* Applied */}
        <Box sx={{ flex: 1, height: appliedH, bgcolor: primarySubtle, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${primary}33, transparent)` }} />
          <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 900, fontSize: 28, color: primary, lineHeight: 1, zIndex: 1 }}>
            {appliedCount}
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: onSurfaceVariant, letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5, zIndex: 1 }}>
            Applied
          </Typography>
        </Box>

        {/* Connector */}
        <Box sx={{ width: 40, height: appliedH, bgcolor: `${primary}0D`, clipPath: "polygon(0 20%, 100% 40%, 100% 60%, 0 80%)", flexShrink: 0 }} />

        {/* Interviews */}
        <Box sx={{ flex: 1, height: interviewsH, bgcolor: primaryFixed, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${primary}33, transparent)` }} />
          <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 900, fontSize: 24, color: onPrimaryFixedVariant, lineHeight: 1, zIndex: 1 }}>
            {interviewsCount}
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: onSurfaceVariant, letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5, zIndex: 1 }}>
            Interviews
          </Typography>
        </Box>

        {/* Connector */}
        <Box sx={{ width: 40, height: interviewsH, bgcolor: `${success}0D`, clipPath: "polygon(0 30%, 100% 45%, 100% 55%, 0 70%)", flexShrink: 0 }} />

        {/* Offers */}
        <Box sx={{ flex: 1, height: offersH, bgcolor: `${success}26`, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${success}33, transparent)` }} />
          <Typography sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 900, fontSize: 20, color: successDark, lineHeight: 1, zIndex: 1 }}>
            {offersCount}
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: onSurfaceVariant, letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5, zIndex: 1 }}>
            Offers
          </Typography>
        </Box>
      </Box>

      {/* Decorative blur orb */}
      <Box sx={{ position: "absolute", right: -80, bottom: -80, width: 256, height: 256, bgcolor: `${primary}08`, borderRadius: "50%", filter: "blur(48px)" }} />
    </Paper>
  );
}
