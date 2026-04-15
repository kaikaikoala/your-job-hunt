import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { type ApplicationWithStages } from '../api/applications';
import ApplicationCard from './ApplicationCard';
import { onSurface, onSurfaceVariant, surfaceContainerLow, surfaceContainerHigh } from '../colors';

// ─── Application list ─────────────────────────────────────────────────────────

export default function ApplicationList({
  isLoading,
  visibleApps,
  selectedNode,
}: {
  isLoading: boolean;
  visibleApps: ApplicationWithStages[] | undefined;
  selectedNode: string | null;
}) {
  const resultCount = visibleApps?.length ?? 0;

  return (
    <Box sx={{ bgcolor: { xs: 'transparent', md: surfaceContainerLow }, borderRadius: { xs: 0, md: 3 }, p: { xs: 0, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 24, color: onSurface }}>
          Refined Application List
        </Typography>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            bgcolor: surfaceContainerHigh,
            borderRadius: '9999px',
            fontSize: 12,
            fontWeight: 700,
            color: onSurfaceVariant,
          }}
        >
          {resultCount} Results
        </Box>
      </Box>

      {/* Body */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : visibleApps && visibleApps.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" sx={{ color: onSurfaceVariant, mb: 1 }}>
            {selectedNode ? `No applications at "${selectedNode}" stage.` : 'No applications yet.'}
          </Typography>
          {!selectedNode && (
            <Typography sx={{ color: onSurfaceVariant }}>
              Click "New Application" to add your first one!
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visibleApps?.map((app) => (
            <ApplicationCard key={app.appId} app={app} />
          ))}
        </Box>
      )}
    </Box>
  );
}
