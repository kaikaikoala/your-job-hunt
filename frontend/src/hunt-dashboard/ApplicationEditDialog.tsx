import { useRef, useState, useEffect } from 'react';
import {
  Alert,
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
import { updateApplication, type Application, type PatchApplicationInput } from '../api/applications';
import NetworkContactAutocomplete, { type NetworkAutocompleteHandle } from './NetworkContactAutocomplete';
import { type NetworkContact } from '../api/network';
import axios from 'axios';

interface Props {
  open: boolean;
  app: Application | null;
  referrer?: NetworkContact;
  onClose: () => void;
}

export default function ApplicationEditDialog({ open, app, referrer, onClose }: Props) {
  const qc = useQueryClient();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobPostingUrl, setJobPostingUrl] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  const referrerRef = useRef<NetworkAutocompleteHandle>(null);

  useEffect(() => {
    if (open && app) {
      setCompany(app.company);
      setRole(app.role);
      setJobPostingUrl(app.jobPostingUrl ?? '');
      setSalaryRange(app.salaryRange ?? '');
      setDuplicateError(false);
      // init referrer after render so the ref is ready
      setTimeout(() => {
        referrerRef.current?.init(referrer ?? null);
      }, 0);
    }
  }, [open, app, referrer]);

  const mutation = useMutation({
    mutationFn: (input: PatchApplicationInput) => updateApplication(app!.appId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application', app?.appId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      handleClose();
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDuplicateError(true);
      }
    },
  });

  const handleClose = () => {
    mutation.reset();
    setDuplicateError(false);
    onClose();
  };

  const handleSubmit = async () => {
    setDuplicateError(false);
    const resolvedReferrerId = await referrerRef.current?.resolveReferrerId();
    const hadReferrer = !!app?.referrerId;
    const clearReferrer = hadReferrer && resolvedReferrerId === undefined;

    mutation.mutate({
      company: company.trim(),
      role: role.trim(),
      jobPostingUrl: jobPostingUrl.trim() || null,
      salaryRange: salaryRange.trim() || null,
      referrerId: resolvedReferrerId ?? null,
      clearReferrer,
    });
  };

  const canSubmit = company.trim() !== '' && role.trim() !== '' && !mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, pr: 6 }}>
        Edit Application
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
          <NetworkContactAutocomplete ref={referrerRef} enabled={open} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
