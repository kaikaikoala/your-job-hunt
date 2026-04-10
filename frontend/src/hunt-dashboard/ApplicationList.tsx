import React, { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ApplicationWithStages, type DashboardData, deleteApplication } from '../api/applications';
import { createStage } from '../api/stages';
import AddStageDialog from './AddStageDialog';
import AddActionItemDialog from './AddActionItemDialog';
import { primary, onSurface, onSurfaceVariant, outlineVariant, error, borderSubtle, surfaceContainerLow, surfaceContainerLowest, surfaceContainerHigh, stageColor } from '../colors';

const AppAiAssistant = React.lazy(() => import('./AppAiAssistant'));

// ─── Misc ─────────────────────────────────────────────────────────────────────

const todayIso = () => new Date().toISOString().slice(0, 10);

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
    <Box sx={{ bgcolor: surfaceContainerLow, borderRadius: 3, p: 4 }}>
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

// ─── Application card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: ApplicationWithStages }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addActionItemOpen, setAddActionItemOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAnchorEl, setChatAnchorEl] = useState<HTMLElement | null>(null);

  const latestStage = app.latestStage?.stage;
  const dotColor = stageColor(latestStage);

  const rejectMutation = useMutation({
    mutationFn: () =>
      createStage(app.appId, { stage: 'Rejected', stageDate: todayIso(), result: 'Rejected' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(app.appId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['dashboard'] });
      const previous = qc.getQueryData<DashboardData>(['dashboard']);
      qc.setQueryData<DashboardData>(['dashboard'], (old) =>
        old ? { ...old, applications: old.applications.filter((a) => a.appId !== app.appId) } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['dashboard'], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: surfaceContainerLowest,
          border: `1px solid ${borderSubtle}`,
          '&:hover': { boxShadow: '0 4px 16px rgba(25,28,30,0.08)' },
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/applications/${app.appId}`)}
      >
        {/* Left: logo + info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            variant="rounded"
            sx={{ width: 52, height: 52, bgcolor: surfaceContainerHigh, color: onSurfaceVariant, fontWeight: 700, fontSize: 20, borderRadius: 2 }}
          >
            {app.company.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: primary }}>
              {app.role}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: onSurfaceVariant }}>
                {app.company}
              </Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: outlineVariant }} />
              <Typography sx={{ fontSize: 14, color: onSurfaceVariant }}>Applied recently</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right: stage + actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
              Current Stage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor }} />
              <Typography sx={{ fontSize: 14, color: onSurfaceVariant }}>
                {latestStage ?? '—'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ width: '1px', height: 36, bgcolor: borderSubtle }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
              sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, borderColor: outlineVariant, color: onSurfaceVariant, fontSize: 13, px: 1.5 }}
            >
              Rejected
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setAddStageOpen(true)}
              sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13 }}
            >
              Passed Round
            </Button>
            <Tooltip title="Add Action Item">
              <IconButton size="small" sx={{ color: onSurfaceVariant }} onClick={() => setAddActionItemOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_task</span>
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" sx={{ color: error }} onClick={() => setDeleteConfirmOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
              </IconButton>
            </Tooltip>
            <Tooltip title="AI Assistant">
              <IconButton
                size="small"
                sx={{ color: onSurfaceVariant }}
                onClick={(e) => { setChatAnchorEl(e.currentTarget); setChatOpen(true); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth onClick={(e) => e.stopPropagation()}>
        <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Delete Application?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently delete <strong>{app.role}</strong> at <strong>{app.company}</strong>? This cannot be undone.
          </DialogContentText>
          {deleteMutation.isError && (
            <DialogContentText sx={{ color: error, mt: 1, fontSize: 14 }}>
              Cannot delete — this application has action items. Remove them first.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteConfirmOpen(false); deleteMutation.reset(); }} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(undefined, {
                onSuccess: () => setDeleteConfirmOpen(false),
              });
            }}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddStageDialog open={addStageOpen} appId={app.appId} onClose={() => setAddStageOpen(false)} />
      <AddActionItemDialog open={addActionItemOpen} appId={app.appId} onClose={() => setAddActionItemOpen(false)} />
      <Suspense fallback={null}>
        <AppAiAssistant
          appId={app.appId}
          company={app.company}
          anchorEl={chatAnchorEl}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </Suspense>
    </>
  );
}
