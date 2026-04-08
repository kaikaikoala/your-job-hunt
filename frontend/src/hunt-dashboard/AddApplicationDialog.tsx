import { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApplication, type CreateApplicationInput } from '../api/applications';
import { fetchContacts, createContact, type NetworkContact } from '../api/network';
import axios from 'axios';

interface Props {
  open: boolean;
  onClose: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddApplicationDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobPostingUrl, setJobPostingUrl] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [stageDate, setStageDate] = useState(todayIso);
  const [referrerValue, setReferrerValue] = useState<NetworkContact | string | null>(null);
  const [referrerInput, setReferrerInput] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);

  const { data: contacts } = useQuery({
    queryKey: ['network'],
    queryFn: fetchContacts,
    enabled: open,
  });

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
    setStageDate(todayIso());
    setReferrerValue(null);
    setReferrerInput('');
    setDuplicateError(false);
    mutation.reset();
    onClose();
  };

  const handleSubmit = async (initialStage: 'Applied' | 'Referred') => {
    setDuplicateError(false);

    let finalReferrerId: string | undefined;
    if (referrerValue && typeof referrerValue === 'object') {
      finalReferrerId = referrerValue.referrerId;
    } else {
      const newName = (typeof referrerValue === 'string' ? referrerValue : referrerInput).trim();
      if (newName) {
        const newContact = await createContact({ name: newName });
        qc.invalidateQueries({ queryKey: ['network'] });
        finalReferrerId = newContact.referrerId;
      }
    }

    mutation.mutate({
      company: company.trim(),
      role: role.trim(),
      jobPostingUrl: jobPostingUrl.trim() || undefined,
      salaryRange: salaryRange.trim() || undefined,
      initialStage,
      stageDate,
      referrerId: finalReferrerId,
    });
  };

  const canSubmit = company.trim() !== '' && role.trim() !== '' && !mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, pr: 6 }}>
        New Application
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
          <Autocomplete
            freeSolo
            options={contacts ?? []}
            getOptionLabel={(option) =>
              typeof option === 'string'
                ? option
                : `${option.name}${option.type ? ` (${option.type})` : ''}`
            }
            value={referrerValue}
            onChange={(_, newValue) => setReferrerValue(newValue)}
            inputValue={referrerInput}
            onInputChange={(_, newInput) => setReferrerInput(newInput)}
            renderInput={(params) => (
              <TextField {...params} label="Referred by (optional)" />
            )}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={stageDate}
            onChange={(e) => setStageDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleSubmit('Referred')}
          disabled={!canSubmit}
        >
          {mutation.isPending ? 'Adding…' : 'Referred'}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSubmit('Applied')}
          disabled={!canSubmit}
        >
          {mutation.isPending ? 'Adding…' : 'Applied'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
