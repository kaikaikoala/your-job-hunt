import { useState, useEffect } from 'react';
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
import {
  createContact,
  updateContact,
  type NetworkContact,
  type CreateNetworkInput,
} from '../api/network';

interface Props {
  open: boolean;
  onClose: () => void;
  contact?: NetworkContact;
}

export default function AddEditContactDialog({ open, onClose, contact }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? '');
      setType(contact?.type ?? '');
    }
  }, [open, contact]);

  const mutation = useMutation({
    mutationFn: (input: CreateNetworkInput) =>
      contact ? updateContact(contact.referrerId, input) : createContact(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['network'] });
      handleClose();
    },
  });

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    mutation.mutate({ name: name.trim(), type: type.trim() || undefined });
  };

  const canSubmit = name.trim() !== '' && !mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, pr: 6 }}>
        {contact ? 'Edit Contact' : 'Add Contact'}
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
            label="Name"
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <TextField
            label="Type (optional)"
            fullWidth
            placeholder="e.g. Friend, Recruiter, Alumni"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {mutation.isPending ? 'Saving…' : contact ? 'Save' : 'Add Contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
