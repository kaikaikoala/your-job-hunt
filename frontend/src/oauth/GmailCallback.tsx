import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { createEmailSettings } from '../api/emailSettings';

export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    if (!code) {
      setError('Missing OAuth code.');
      return;
    }
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    sessionStorage.removeItem('pkce_verifier');
    if (!codeVerifier) {
      setError('OAuth session expired. Please try again.');
      return;
    }
    const redirectUri = window.location.origin + '/oauth/gmail/callback';
    createEmailSettings(code, redirectUri, codeVerifier)
      .then(() => navigate('/hunt'))
      .catch(() => setError('Failed to connect Gmail. Please try again.'));
  }, []);

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}
