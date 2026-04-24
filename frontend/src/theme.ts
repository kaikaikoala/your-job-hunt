import { createTheme } from '@mui/material/styles';
import { surface, surfaceContainerLowest, primary, error, success, onSurface, onSurfaceVariant } from './colors';

const MANROPE = 'Manrope, sans-serif';
const INTER = 'Inter, sans-serif';

export const theme = createTheme({
  palette: {
    background: {
      default: surface,
      paper: surfaceContainerLowest,
    },
    primary: { main: primary },
    error: { main: error },
    success: { main: success },
    text: { primary: onSurface, secondary: onSurfaceVariant },
  },
  typography: {
    fontFamily: INTER,

    // ── Display / Headings (Manrope) ──────────────────────────────────────────
    h1: { fontFamily: MANROPE, fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.02em' }, // 36px
    h2: { fontFamily: MANROPE, fontSize: '1.5rem',  fontWeight: 600, letterSpacing: '-0.01em' }, // 24px
    h3: { fontFamily: MANROPE, fontSize: '1.125rem', fontWeight: 500 },                          // 18px
    h4: { fontFamily: MANROPE, fontWeight: 600 },
    h5: { fontFamily: MANROPE, fontWeight: 600 },
    h6: { fontFamily: MANROPE, fontWeight: 600 },
    subtitle1: { fontFamily: MANROPE, fontWeight: 500 },
    subtitle2: { fontFamily: MANROPE, fontWeight: 600 },

    // ── Body / Utility (Inter) ────────────────────────────────────────────────
    body1: { fontSize: '1rem',    lineHeight: 1.6 }, // 16px — resume / long-form content
    body2: { fontSize: '0.875rem', lineHeight: 1.5 }, // 14px — standard UI text
    caption: { fontSize: '0.75rem', fontWeight: 500 }, // 12px — secondary / meta
    overline: {                                         // 11px — label / caps
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },

    // ── Interactive (Manrope — propagates to all MuiButton) ───────────────────
    button: {
      fontFamily: MANROPE,
      fontSize: '0.875rem',  // 14px
      fontWeight: 700,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,    // matches borderRadius: 2 in sx (2 × shape.borderRadius=4)
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: MANROPE,
          fontWeight: 700,
          paddingRight: '3rem', // leave room for close icon button
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '1rem',
        },
      },
    },
  },
});
