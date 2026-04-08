/**
 * Design System: "The Digital Curator"
 * See frontend/README.md → Design System for full specification.
 *
 * Rules:
 *  - No 1px solid dark borders — use background-color shifts instead.
 *  - Depth via tonal stacking: surfaceContainerLowest on surfaceContainerLow on surface.
 *  - Ghost borders only: outlineVariant at low opacity when truly needed.
 */

// ─── Surface Hierarchy ────────────────────────────────────────────────────────

/** Base page background */
export const surface = '#F7F9FB';
/** Section backgrounds — replaces dividers */
export const surfaceContainerLow = '#F2F4F6';
/** Cards and primary floating elements */
export const surfaceContainerLowest = '#FFFFFF';
/** Utility / internal UI (avatar backgrounds, separators) */
export const surfaceContainerHigh = '#E6E8EA';

// ─── Brand / Primary ──────────────────────────────────────────────────────────

/** Indigo — primary action color */
export const primary = '#607CEC';
/** Lighter indigo — button hover glow, filled icon backgrounds */
export const primaryFixed = '#DDE1FF';
/** Deep navy — tertiary button text */
export const onPrimaryFixedVariant = '#173BAB';
/** Focus ring / tint overlay */
export const surfaceTint = '#3755C3';
/** Very light indigo — icon container backgrounds */
export const primarySubtle = '#EEF2FF';
/** Lighter indigo — primary button hover */
export const primaryHover = '#7C93F0';
/** Soft lavender — Applied / Referred stage indicators */
export const primaryLight = '#A5B4FC';

// ─── Text ─────────────────────────────────────────────────────────────────────

/** Primary text — deep midnight navy */
export const onSurface = '#0F172A';
/** Secondary / supporting text */
export const onSurfaceVariant = '#45464D';

// ─── Outlines & Borders ───────────────────────────────────────────────────────

/** Ghost borders and disabled / muted states */
export const outlineVariant = '#C6C6CD';
/** Subtle card and row dividers */
export const borderSubtle = '#ECEEF0';
/** NavBar and input borders */
export const borderLight = '#E2E8F0';
/** Very faint card outlines */
export const borderFaint = '#F1F5F9';

// ─── Semantic ─────────────────────────────────────────────────────────────────

export const error = '#BA1A1A';
export const errorContainer = '#FFDAD6';
/** Offer stage / positive outcome */
export const success = '#4EDEA3';
/** Success labels (e.g. "Resume Optimized") */
export const successDark = '#009668';

// ─── Stage palette ────────────────────────────────────────────────────────────

export const STAGE_COLORS: Record<string, string> = {
  Applied: primaryLight,
  Referred: primaryLight,
  Technical: primary,
  Offer: success,
  Rejected: error,
};

export function stageColor(stage?: string): string {
  if (!stage) return outlineVariant;
  return STAGE_COLORS[stage] ?? primary;
}

// ─── Dark-section palette (LandingPage hero) ─────────────────────────────────

export const dark = {
  surface: '#0F172A',
  surfaceSubtle: '#1E293B',
  border: '#334155',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  textFaint: '#CBD5E1',
} as const;
