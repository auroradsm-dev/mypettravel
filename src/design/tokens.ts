// ── PetMove design tokens ──────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg:           '#F7F4EF',   // warm off-white
  surface:      '#FFFDF9',   // cream cards
  surfaceAlt:   '#F2EDE3',   // slightly deeper cream

  // Text
  text:         '#2C2825',   // warm charcoal
  textSoft:     '#8A7F78',   // warm gray
  textMuted:    '#B8AFA8',   // muted warm
  textInverse:  '#FFFDF9',

  // Brand accent
  gold:         '#C9A96E',
  goldLight:    '#F5EDDC',
  goldMid:      '#E8D4A8',
  goldDark:     '#A07840',

  sage:         '#8FAF8A',
  sageLight:    '#EAF1E8',

  // Borders
  border:       '#EDE8E0',
  borderLight:  '#F5F0E8',

  // Buttons
  btnPrimary:   '#2C2825',
  btnPrimaryText: '#FFFDF9',

  // Status — warmed palette
  statusGreen:      '#6B9E6B',
  statusGreenBg:    '#EDF4ED',
  statusRed:        '#C25E5E',
  statusRedBg:      '#FBF0F0',
  statusOrange:     '#C9884A',
  statusOrangeBg:   '#FDF3E8',
  statusBlue:       '#5B8AAF',
  statusBlueBg:     '#EDF3F8',
  statusPurple:     '#8B6BAE',
  statusPurpleBg:   '#F3EEF8',
  statusGray:       '#A09890',
  statusGrayBg:     '#F5F2EF',
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 100,
} as const

export const shadow = {
  card: {
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  lifted: {
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
  },
} as const

// Status color lookup (maps app.config.json color names → design tokens)
export const statusColors = {
  bg: (name: string): string => ({
    green:  colors.statusGreenBg,
    red:    colors.statusRedBg,
    orange: colors.statusOrangeBg,
    blue:   colors.statusBlueBg,
    gray:   colors.statusGrayBg,
    purple: colors.statusPurpleBg,
  }[name] ?? colors.statusGrayBg),

  fg: (name: string): string => ({
    green:  colors.statusGreen,
    red:    colors.statusRed,
    orange: colors.statusOrange,
    blue:   colors.statusBlue,
    gray:   colors.statusGray,
    purple: colors.statusPurple,
  }[name] ?? colors.statusGray),
}
