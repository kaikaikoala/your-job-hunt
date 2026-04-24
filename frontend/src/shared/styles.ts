/**
 * Reusable sx prop objects for repeated layout patterns.
 * Import and spread into the sx prop: <Paper elevation={0} sx={cardSx} />
 */
import type { SxProps, Theme } from '@mui/material/styles';
import { borderSubtle, surfaceContainerLowest, surfaceContainerLow } from '../colors';

/** Standard dashboard card — white surface, subtle border, responsive padding. */
export const cardSx: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  borderRadius: 3,
  bgcolor: surfaceContainerLowest,
  border: `1px solid ${borderSubtle}`,
};

/** Compact card for dense sections or dialog content areas. */
export const tightCardSx: SxProps<Theme> = {
  p: 3,
  borderRadius: 3,
  bgcolor: surfaceContainerLowest,
  border: `1px solid ${borderSubtle}`,
};

/** Section background block — replaces dividers per the No-Line Rule. */
export const sectionSx: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  borderRadius: 3,
  bgcolor: surfaceContainerLow,
};
