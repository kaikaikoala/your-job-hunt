import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApplication, type CreateApplicationInput } from '../api/applications';
import axios from 'axios';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddApplicationDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobPostingUrl, setJobPostingUrl] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: CreateApplicationInput) => createApplication(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      handleClose();
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDuplicateError(true);
      }
    },
  });

  const handleClose = () => {
    setCompany('');
    setRole('');
    setJobPostingUrl('');
    setSalaryRange('');
    setDuplicateError(false);
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    setDuplicateError(false);
    mutation.mutate({
      company: company.trim(),
      role: role.trim(),
      jobPostingUrl: jobPostingUrl.trim() || undefined,
      salaryRange: salaryRange.trim() || undefined,
    });
  };

  const canSubmit = company.trim() !== '' && role.trim() !== '' && !mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>
        New Application
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {duplicateError && (
            <Alert severity="error">An application with this URL already exists.</Alert>
          )}
          <TextField
            label="Company"
            required
            fullWidth
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <TextField
            label="Role"
            required
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <TextField
            label="Job Posting URL"
            fullWidth
            value={jobPostingUrl}
            onChange={(e) => {
              setJobPostingUrl(e.target.value);
              setDuplicateError(false);
            }}
          />
          <TextField
            label="Salary Range"
            fullWidth
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {mutation.isPending ? 'Adding…' : 'Add Application'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
