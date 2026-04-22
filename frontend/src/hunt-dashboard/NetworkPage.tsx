import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContacts, deleteContact, type NetworkContact } from '../api/network';
import AddEditContactDialog from './AddEditContactDialog';
import NavBar from '../shared/NavBar';
import Footer from '../shared/Footer';
import {
  surface,
  onSurface,
  onSurfaceVariant,
  outlineVariant,
  borderSubtle,
  surfaceContainerLowest,
  error,
} from '../colors';
import axios from 'axios';

export default function NetworkPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<NetworkContact | undefined>(undefined);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['network'],
    queryFn: fetchContacts,
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surface }}>
      <NavBar activeLink="network" />

      <Box component="main" sx={{ pt: '80px', px: 4, pb: 6, maxWidth: 860, mx: 'auto' }}>
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { sm: 'flex-end' },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: onSurface, mb: 0.5 }}
            >
              Network
            </Typography>
            <Typography sx={{ color: onSurfaceVariant, fontSize: 14 }}>
              Manage contacts and referrers in your job hunt.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            + Add Contact
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !contacts || contacts.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" sx={{ color: onSurfaceVariant, mb: 1 }}>
              No contacts yet.
            </Typography>
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${borderSubtle}`,
              bgcolor: surfaceContainerLowest,
            }}
          >
            <Stack spacing={0}>
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.referrerId}
                  contact={contact}
                  onEdit={() => setEditContact(contact)}
                />
              ))}
            </Stack>
          </Paper>
        )}
      </Box>

      <AddEditContactDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <AddEditContactDialog
        open={editContact !== undefined}
        onClose={() => setEditContact(undefined)}
        contact={editContact}
      />
      <Footer />
    </Box>
  );
}

function ContactRow({
  contact,
  onEdit,
}: {
  contact: NetworkContact;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(contact.referrerId),
    onSuccess: () => {
      setDeleteError(null);
      qc.invalidateQueries({ queryKey: ['network'] });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDeleteError('Contact is linked to applications or tasks');
      }
    },
  });

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${borderSubtle}`,
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, color: onSurface, fontWeight: 600 }}>
            {contact.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
            {contact.type && (
              <Typography sx={{ fontSize: 12, color: onSurfaceVariant }}>{contact.type}</Typography>
            )}
            <Typography sx={{ fontSize: 12, color: outlineVariant }}>
              {contact.linkedAppCount} linked app{contact.linkedAppCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit} sx={{ color: onSurfaceVariant, ml: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            sx={{ color: error, ml: 0.5 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </IconButton>
        </Tooltip>
      </Box>
      {deleteError && (
        <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: 12 }}>
          {deleteError}
        </Alert>
      )}
    </Box>
  );
}
