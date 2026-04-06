import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  async function handleSignIn() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign-in error:', err);
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F7F9FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Box
        sx={{
          bgcolor: 'white',
          border: '1px solid #f1f5f9',
          borderRadius: '16px',
          p: { xs: 5, sm: 8 },
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 900,
            fontSize: '1.4rem',
            color: '#0F172A',
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          The Digital Curator
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: '1.75rem',
            color: '#0F172A',
            mt: 4,
            mb: 1,
          }}
        >
          Welcome back
        </Typography>

        <Typography sx={{ color: '#45464D', fontSize: '0.95rem', mb: 5 }}>
          Sign in to continue to your job hunt dashboard.
        </Typography>

        <Button
          fullWidth
          variant="outlined"
          onClick={handleSignIn}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Box
                component="img"
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                sx={{ width: 18, height: 18 }}
              />
            )
          }
          sx={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none',
            borderRadius: '8px',
            py: 1.5,
            borderColor: '#e2e8f0',
            color: '#0F172A',
            '&:hover': { borderColor: '#607CEC', bgcolor: '#f8faff' },
          }}
        >
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </Button>
      </Box>
    </Box>
  );
}
