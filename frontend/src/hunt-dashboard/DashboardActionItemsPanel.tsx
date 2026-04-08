import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchActionItems, updateActionItem, type ActionItem } from '../api/actionItems';
import AddActionItemDialog from './AddActionItemDialog';

function formatDue(iso?: string) {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DashboardActionItemsPanel() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['actionItems', { status: 'open' }],
    queryFn: () => fetchActionItems({ status: 'open' }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => updateActionItem(id, { status: 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actionItems'] }),
  });

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 240,
        p: 4,
        borderRadius: 3,
        bgcolor: '#ECF0F5', // surface-container-low
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 20, color: '#0F172A' }}>
          To-Do List
        </Typography>
        <span className="material-symbols-outlined" style={{ color: '#45464D' }}>pending_actions</span>
      </Box>

      {/* Items */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, flex: 1 }}>
          <CircularProgress size={20} />
        </Box>
      ) : !items || items.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: '#45464D', fontSize: 14 }}>No open tasks</Typography>
        </Box>
      ) : (
        <Stack spacing={2} sx={{ overflow: 'auto', flex: 1 }}>
          {items.map((item: ActionItem, idx: number) => (
            <Box
              key={item.actionItemId}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                p: 2,
                bgcolor: '#FFFFFF', // surface-container-lowest
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                ...(idx === 0 && {
                  borderLeft: '4px solid #607CEC',
                }),
                opacity: idx === 0 ? 1 : 0.85,
              }}
            >
              <Checkbox
                size="small"
                checked={false}
                disabled={completeMutation.isPending}
                onChange={() => completeMutation.mutate(item.actionItemId)}
                sx={{ mt: -0.5, mr: 0.5, p: 0.5, color: '#c6c6cd' }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 14,
                    fontWeight: idx === 0 ? 700 : 500,
                    color: '#0F172A',
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </Typography>
                {item.dueDate ? (
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: '#45464D',
                      mt: 0.5,
                      fontStyle: idx === 0 ? 'italic' : 'normal',
                    }}
                  >
                    Due {formatDue(item.dueDate)}
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: 11, color: '#45464D', mt: 0.5 }}>No due date</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {/* CTA at bottom */}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setAddOpen(true)}
        sx={{
          mt: 3,
          py: 1.5,
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: 14,
          color: '#45464D',
          borderColor: 'rgba(0,0,0,0.15)',
          borderRadius: 2,
          textTransform: 'none',
          '&:hover': {
            bgcolor: '#DDE3EC',
            borderColor: 'rgba(0,0,0,0.15)',
          },
        }}
      >
        + Add Task
      </Button>

      <AddActionItemDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </Paper>
  );
}
