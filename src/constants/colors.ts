/** Single source of truth for every color used in the app. */
export const colors = {
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.55)',

  // Brand greens
  primary: '#2d7a33',
  primaryDark: '#0f3d14',
  textPrimary: '#1d2a1d',
  textMuted: '#4d7c4d',
  textSubtle: '#8a9a8a',
  textSoft: '#6b8f6b',
  textOnPrimarySoft: '#d9f0d9',

  // Surfaces and borders
  screenBackground: '#f5f8f2',
  surfaceTint: '#eaf7ea',
  border: '#cce6cc',
  borderNeutral: '#c4cbc4',

  // Blues
  navy: '#1E3A8A',
  blueTrack: '#cfe3fb',
  blueTint: '#eaf2fd',
  blueAccent: '#208AEF',
  gradientBlueStart: '#3C9FFE',
  gradientBlueEnd: '#0274DF',

  // Status
  danger: '#b3261e',

  // Default light/dark theme palette
  lightBackgroundElement: '#F0F0F3',
  lightBackgroundSelected: '#E0E1E6',
  lightTextSecondary: '#60646C',
  darkBackgroundElement: '#212225',
  darkBackgroundSelected: '#2E3135',
  darkTextSecondary: '#B0B4BA',
} as const;
