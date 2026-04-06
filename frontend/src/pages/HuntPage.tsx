import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchApplications, type Application } from '../api/applications';
import AddApplicationDialog from '../components/AddApplicationDialog';
import NavBar from '../components/NavBar';

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F9FB' }}>
      <NavBar activeLink="hunt-tracker" />

      {/* Main */}
      <Box component="main" sx={{ pt: '64px', px: 4, pb: 4, maxWidth: 1280, mx: 'auto' }}>
        {/* Header */}
        <Box
          sx={{
            mb: 6,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { md: 'flex-end' },
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: '#0F172A', mb: 1 }}
            >
              The Hunt Dashboard
            </Typography>
            <Typography sx={{ color: '#45464D', fontSize: 16 }}>
              Your professional journey, curated.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
            sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, borderRadius: 2, px: 3, py: 1.5 }}
          >
            New Application
          </Button>
        </Box>

        {/* Application list */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : applications && applications.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" sx={{ color: '#45464D', mb: 1 }}>
              No applications yet.
            </Typography>
            <Typography sx={{ color: '#45464D' }}>
              Click "New Application" to add your first one!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {applications?.map((app) => (
              <ApplicationCard key={app.appId} app={app} />
            ))}
          </Box>
        )}
      </Box>

      <AddApplicationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#fff',
        border: '1px solid #eceef0',
        '&:hover': { boxShadow: '0 4px 16px rgba(25,28,30,0.08)' },
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Left: logo + info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar
          variant="rounded"
          sx={{ width: 52, height: 52, bgcolor: '#eceef0', color: '#45464D', fontWeight: 700, fontSize: 20, borderRadius: 2 }}
        >
          {app.company.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#607CEC' }}>
            {app.role}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#45464D' }}>
              {app.company}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#c6c6cd' }} />
            <Typography sx={{ fontSize: 14, color: '#45464D' }}>Applied recently</Typography>
          </Box>
        </Box>
      </Box>

      {/* Right: stage + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#45464D', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
            Current Stage
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c6c6cd' }} />
            <Typography sx={{ fontSize: 14, color: '#45464D' }}>—</Typography>
          </Box>
        </Box>

        <Box sx={{ width: 1, height: 36, bgcolor: '#eceef0' }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, borderColor: '#c6c6cd', color: '#45464D', fontSize: 13 }}
          >
            Rejected
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13 }}
          >
            Passed Round
          </Button>
          <Tooltip title="Add Action Item">
            <IconButton size="small" sx={{ color: '#45464D' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_task</span>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}
