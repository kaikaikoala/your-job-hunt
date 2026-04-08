import { createTheme } from '@mui/material/styles';
import { surface, primary, error, success, onSurface, onSurfaceVariant } from './colors';

export const theme = createTheme({
  palette: {
    background: { default: surface },
    primary: { main: primary },
    error: { main: error },
    success: { main: success },
    text: { primary: onSurface, secondary: onSurfaceVariant },
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
