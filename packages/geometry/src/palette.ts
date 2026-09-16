/** Constructive brand colors (source: constructive.io brand kit). */
export const colors = {
  blue: '#01A1FF',
  ink: '#232323',
  gray: '#8E9398',
  mist: '#F3F6FA',
  paleBlue: '#D4DCEA',
  white: '#FFFFFF',
} as const;

export const gradients = {
  blue: { from: '#1EC9FF', to: '#1E78FF' },
  frost: { from: '#F5F8FF', to: '#C8D7FF' },
} as const;

export const fonts = {
  sans: 'Inter',
  display: 'Poppins',
  serif: 'Merriweather',
} as const;

/** Fill for the three visible cube faces. */
export interface FaceColors {
  top: string;
  left: string;
  right: string;
}

/** Colorways for the mark. */
export const colorways: Record<'light' | 'dark' | 'mono' | 'solid', FaceColors & { stroke: string }> = {
  /** White faces, blue right face and edges — the primary mark on light backgrounds. */
  light: { top: colors.white, left: colors.white, right: colors.blue, stroke: colors.blue },
  /** Same construction on dark backgrounds. */
  dark: { top: colors.ink, left: colors.ink, right: colors.blue, stroke: colors.blue },
  /** One-color usage. */
  mono: { top: colors.white, left: colors.white, right: colors.white, stroke: colors.ink },
  /** Shaded solid for 3D. */
  solid: { top: '#4FBDFF', left: '#0186D6', right: colors.blue, stroke: colors.blue },
};
