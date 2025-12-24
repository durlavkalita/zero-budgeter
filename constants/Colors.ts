const tintColorLight = '#6366f1'; // Indigo-600
const tintColorDark = '#818cf8';  // Indigo-400

export default {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',      // Card backgrounds
    success: '#10b981',      // Money available
    danger: '#ef4444',       // Overspent
    border: '#e2e8f0',
    muted: '#64748b',
  },
  dark: {
    text: '#f8fafc',
    background: '#020617',   // Deeper than pure black
    tint: tintColorDark,
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    surface: '#0f172a',      // Slate-900
    success: '#34d399',
    danger: '#f87171',
    border: '#1e293b',
    muted: '#94a3b8',
  },
};