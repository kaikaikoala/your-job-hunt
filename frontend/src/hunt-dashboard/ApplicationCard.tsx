import React, { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ApplicationWithStages } from '../api/applications';
import { createStage } from '../api/stages';
import ApplicationStageAddDialog from './ApplicationStageAddDialog';
import ActionItemAddDialog from './ActionItemAddDialog';
import { primary, onSurfaceVariant, outlineVariant, borderSubtle, surfaceContainerLowest, surfaceContainerHigh, stageColor } from '../colors';

const ApplicationAiAssistant = React.lazy(() => import('./ApplicationAiAssistant'));

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function ApplicationCard({ app }: { app: ApplicationWithStages }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addActionItemOpen, setAddActionItemOpen] = useState(false);
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

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          bgcolor: surfaceContainerLowest,
          border: `1px solid ${borderSubtle}`,
          '&:hover': { boxShadow: '0 4px 16px rgba(25,28,30,0.08)' },
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
          gap: { xs: 1.5, sm: 0 },
        }}
        onClick={() => navigate(`/applications/${app.appId}`)}
      >
        {/* Left: info (no avatar on mobile) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            variant="rounded"
            sx={{ width: 52, height: 52, bgcolor: surfaceContainerHigh, color: onSurfaceVariant, fontWeight: 700, fontSize: 20, borderRadius: 2, display: { xs: 'none', sm: 'flex' } }}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, width: { xs: '100%', sm: 'auto' } }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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

      <ApplicationStageAddDialog open={addStageOpen} appId={app.appId} onClose={() => setAddStageOpen(false)} />
      <ActionItemAddDialog open={addActionItemOpen} appId={app.appId} onClose={() => setAddActionItemOpen(false)} />
      <Suspense fallback={null}>
        <ApplicationAiAssistant
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
