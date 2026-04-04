import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    background: { default: '#F7F9FB' },
    primary: { main: '#607CEC' },
    error: { main: '#BA1A1A' },
    success: { main: '#4EDEA3' },
    text: { primary: '#0F172A', secondary: '#45464D' },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: { fontFamily: 'Manrope, sans-serif' },
    h2: { fontFamily: 'Manrope, sans-serif' },
    h3: { fontFamily: 'Manrope, sans-serif' },
    h4: { fontFamily: 'Manrope, sans-serif' },
    h5: { fontFamily: 'Manrope, sans-serif' },
    h6: { fontFamily: 'Manrope, sans-serif' },
  },
});
