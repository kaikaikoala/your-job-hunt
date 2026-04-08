import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

const OTHER = 'Other';
const STAGE_OPTIONS = [
  'Referred',
  'Applied',
  'Recruiter Screen',
  'Team Lead/Manager Screen',
  'Technical Screen',
  'Onsite Technical',
  'Offer',
  'Rejected',
  OTHER,
];
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStage, type CreateStageInput } from '../api/stages';

interface Props {
  open: boolean;
  appId: string;
  onClose: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddStageDialog({ open, appId, onClose }: Props) {
  const qc = useQueryClient();
  const [stage, setStage] = useState('');
  const [stageSelect, setStageSelect] = useState('');
  const [stageDate, setStageDate] = useState(todayIso);
  const [result, setResult] = useState('');

  const mutation = useMutation({
    mutationFn: (input: CreateStageInput) => createStage(appId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', appId] });
      qc.invalidateQueries({ queryKey: ['applications'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setStage('');
    setStageSelect('');
    setStageDate(todayIso());
    setResult('');
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    mutation.mutate({
      stage: stage.trim(),
      stageDate: stageDate || undefined,
      result: result.trim() || undefined,
    });
  };

  const canSubmit = stage.trim() !== '' && !mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, pr: 6 }}>
        Add Stage
        <IconButton
          onClick={handleClose}
          disabled={mutation.isPending}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Stage</InputLabel>
            <Select
              value={stageSelect}
              label="Stage"
              onChange={(e) => {
                const val = e.target.value;
                setStageSelect(val);
                setStage(val === OTHER ? '' : val);
              }}
            >
              {STAGE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {stageSelect === OTHER && (
            <TextField
              label="Custom Stage"
              required
              fullWidth
              placeholder="Enter stage name"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              autoFocus
            />
          )}
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={stageDate}
            onChange={(e) => setStageDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Result (optional)"
            fullWidth
            placeholder="e.g. Passed, Pending"
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {mutation.isPending ? 'Adding…' : 'Add Stage'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
