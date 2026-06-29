export const T = {
  // Palette
  navy:    '#0A1628',
  navyMid: '#1A2B45',
  navyLight:'#243652',
  offWhite:'#F7F6F3',
  card:    '#FFFFFF',
  blue:    '#2563EB',
  blueSoft:'#EFF6FF',
  blueBorder:'#BFDBFE',
  green:   '#16A34A',
  greenSoft:'#F0FDF4',
  greenBorder:'#86EFAC',
  amber:   '#D97706',
  amberSoft:'#FFFBEB',
  amberBorder:'#FDE68A',
  red:     '#DC2626',
  redSoft: '#FEF2F2',
  redBorder:'#FECACA',
  slate:   '#64748B',
  slateLight:'#94A3B8',
  border:  '#E2E8F0',
  borderLight:'#F1F5F9',
  text:    '#0F172A',
  textMid: '#334155',
  textSoft:'#64748B',

  // Verdict
  verdict: {
    'Strong fit':    { color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', icon: '✅' },
    'Worth a look':  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '⚠️' },
    'Probably pass': { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '❌' },
  },
}

export const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: #F7F6F3; color: #0F172A; -webkit-font-smoothing: antialiased; }
  input, textarea, select, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
`
