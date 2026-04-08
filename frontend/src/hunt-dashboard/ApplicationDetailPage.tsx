import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApplication } from '../api/applications';
import { fetchStages, updateStage, deleteStage, type Stage, type PatchStageInput } from '../api/stages';
import AddStageDialog from './AddStageDialog';
import NavBar from '../shared/NavBar';

const STAGE_COLORS: Record<string, string> = {
  Applied: '#a5b4fc',
  Referred: '#a5b4fc',
  Technical: '#607CEC',
  Offer: '#4EDEA3',
  Rejected: '#BA1A1A',
};

function stageColor(stage: string) {
  return STAGE_COLORS[stage] ?? '#607CEC';
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addStageOpen, setAddStageOpen] = useState(false);

  const { data: app, isLoading: appLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => fetchApplication(id!),
    enabled: !!id,
  });

  const { data: stages, isLoading: stagesLoading } = useQuery({
    queryKey: ['stages', id],
    queryFn: () => fetchStages(id!),
    enabled: !!id,
  });

  if (appLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F7F9FB' }}>
        <NavBar activeLink="hunt-tracker" />
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: '96px' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!app) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F7F9FB' }}>
        <NavBar activeLink="hunt-tracker" />
        <Box sx={{ textAlign: 'center', pt: '96px' }}>
          <Typography variant="h6" sx={{ color: '#45464D' }}>Application not found.</Typography>
          <Button onClick={() => navigate('/hunt')} sx={{ mt: 2 }}>Back to Dashboard</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F9FB' }}>
      <NavBar activeLink="hunt-tracker" />
      <Box component="main" sx={{ pt: '80px', px: 4, pb: 6, maxWidth: 860, mx: 'auto' }}>

        {/* Back */}
        <Button
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>}
          onClick={() => navigate('/hunt')}
          sx={{ mb: 3, color: '#45464D', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}
        >
          Dashboard
        </Button>

        {/* Application metadata */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eceef0', bgcolor: '#fff', mb: 3 }}>
          <Typography variant="h5" sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            {app.role}
          </Typography>
          <Typography sx={{ fontSize: 16, color: '#45464D', fontWeight: 500, mb: 2 }}>{app.company}</Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            {app.salaryRange && (
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#45464D', textTransform: 'uppercase', letterSpacing: 0.5 }}>Salary</Typography>
                <Typography sx={{ fontSize: 14, color: '#0F172A' }}>{app.salaryRange}</Typography>
              </Box>
            )}
            {app.jobPostingUrl && (
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#45464D', textTransform: 'uppercase', letterSpacing: 0.5 }}>Job Posting</Typography>
                <Typography
                  component="a"
                  href={app.jobPostingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: 14, color: '#607CEC', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  View posting
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Stages timeline */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eceef0', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
              Stages
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={() => setAddStageOpen(true)}
              sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13 }}
            >
              + Add Stage
            </Button>
          </Box>

          {stagesLoading ? (
            <CircularProgress size={24} />
          ) : !stages || stages.length === 0 ? (
            <Typography sx={{ color: '#45464D', fontSize: 14 }}>No stages yet.</Typography>
          ) : (
            <Stack spacing={0}>
              {stages.map((s, idx) => (
                <StageRow key={s.appStageId} stage={s} appId={id!} isLast={idx === stages.length - 1} />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <AddStageDialog open={addStageOpen} appId={id!} onClose={() => setAddStageOpen(false)} />
    </Box>
  );
}

function StageRow({ stage, appId, isLast }: { stage: Stage; appId: string; isLast: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editStage, setEditStage] = useState(stage.stage);
  const [editDate, setEditDate] = useState(stage.stageDate ?? '');
  const [editResult, setEditResult] = useState(stage.result ?? '');

  const updateMutation = useMutation({
    mutationFn: (input: PatchStageInput) => updateStage(appId, stage.appStageId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', appId] });
      qc.invalidateQueries({ queryKey: ['applications'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStage(appId, stage.appStageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', appId] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const color = stageColor(stage.stage);

  if (editing) {
    return (
      <Box sx={{ py: 1.5, borderBottom: isLast ? 'none' : '1px solid #eceef0' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-end" flexWrap="wrap">
          <TextField
            size="small"
            label="Stage"
            value={editStage}
            onChange={(e) => setEditStage(e.target.value)}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            label="Date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            label="Result"
            value={editResult}
            onChange={(e) => setEditResult(e.target.value)}
            sx={{ minWidth: 120 }}
          />
          <Button
            size="small"
            variant="contained"
            disabled={editStage.trim() === '' || updateMutation.isPending}
            onClick={() => updateMutation.mutate({
              stage: editStage.trim(),
              stageDate: editDate || undefined,
              result: editResult.trim() || undefined,
            })}
            sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}
          >
            Save
          </Button>
          <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        borderBottom: isLast ? 'none' : '1px solid #eceef0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{stage.stage}</Typography>
          <Typography sx={{ fontSize: 12, color: '#45464D' }}>{formatDate(stage.stageDate)}</Typography>
        </Box>
        {stage.result && (
          <Chip
            label={stage.result}
            size="small"
            sx={{
              bgcolor: `${color}22`,
              color: color === '#BA1A1A' ? color : '#0F172A',
              fontWeight: 600,
              fontSize: 11,
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setEditing(true)} sx={{ color: '#45464D' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            sx={{ color: '#BA1A1A' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
