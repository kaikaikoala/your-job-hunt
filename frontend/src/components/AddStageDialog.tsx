import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
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
          <TextField
            label="Stage"
            required
            fullWidth
            placeholder="e.g. Technical, Offer"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          />
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
