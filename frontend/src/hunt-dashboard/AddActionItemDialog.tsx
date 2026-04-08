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
import { createActionItem, type CreateActionItemInput } from '../api/actionItems';

interface Props {
  open: boolean;
  onClose: () => void;
  appId?: string;
}

export default function AddActionItemDialog({ open, onClose, appId }: Props) {
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const mutation = useMutation({
    mutationFn: (input: CreateActionItemInput) => createActionItem(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actionItems'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setDescription('');
    setDueDate('');
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    mutation.mutate({
      description: description.trim(),
      appId: appId,
      dueDate: dueDate || undefined,
    });
  };

  const canSubmit = description.trim() !== '' && !mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, pr: 6 }}>
        Add Action Item
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
            label="Description"
            required
            fullWidth
            placeholder="What needs to be done?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
            multiline
            minRows={2}
          />
          <TextField
            label="Due date (optional)"
            type="date"
            fullWidth
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {mutation.isPending ? 'Adding…' : 'Add Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
