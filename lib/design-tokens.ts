export const tokens = {
  color: {
    forest: {
      50: '#F0F9F4', 100: '#DCEFE3', 200: '#C8E6D3', 300: '#A3D4B3',
      500: '#5FA87E', 700: '#2D6B47', 900: '#1A2E2A',
    },
    amber: {
      50: '#FEF6E7', 200: '#FAC775', 500: '#BA7517',
      700: '#854F0B', 900: '#412402',
    },
    slate: {
      50: '#FAFAF8', 100: '#F1EFE8', 200: '#E5E3DA', 300: '#D3D1C7',
      400: '#B4B2A9', 500: '#888780', 600: '#5F5E5A', 700: '#444441',
      800: '#2C2C2A', 950: '#18181A',
    },
    semantic: {
      success: { bg: '#EAF3DE', border: '#3B6D11', text: '#173404' },
      warning: { bg: '#FAEEDA', border: '#854F0B', text: '#412402' },
      danger:  { bg: '#FCEBEB', border: '#A32D2D', text: '#501313' },
      info:    { bg: '#E6F1FB', border: '#185FA5', text: '#042C53' },
    },
  },
  space: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px', '3xl': '48px' },
  radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  fontFamily: {
    serif: '"Instrument Serif", Georgia, serif',
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  fontSize: {
    micro: '11px', small: '12px', body: '14px',
    h3: '16px', h2: '22px', h1: '32px',
  },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { tight: '1.1', snug: '1.3', normal: '1.4', relaxed: '1.6' },
  border: { thin: '0.5px', default: '1px', featured: '2px' },
  shadow: {
    none: 'none',
    focus: '0 0 0 3px rgba(45, 107, 71, 0.15)',
    menu: '0 4px 12px rgba(24, 24, 26, 0.08)',
    modal: '0 16px 48px rgba(24, 24, 26, 0.16)',
  },
  transition: {
    fast: '120ms ease-out',
    base: '200ms ease-out',
    slow: '320ms ease-out',
  },
} as const;
