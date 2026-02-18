/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Alpha Focus - Medical Premium Palette
        background: '#0B1220',
        surface: '#0F1A2B',
        primary: '#1E40AF',
        secondary: '#2563EB',
        accent: '#3B82F6',
        gold: '#93C5FD',

        // Semantic mappings
        onyx: '#0B1220',
        ocean: '#0F1A2B',
        teal: '#3B82F6',
        platinum: '#1F2937',
        mist: '#94A3B8',
        white: '#F8FAFC',
      },
      backgroundImage: {
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #1E40AF 0deg, #2563EB 180deg, #3B82F6 360deg)',
        'hero-gradient': 'linear-gradient(135deg, #0F172A 0%, #0B1220 60%, #111827 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(15, 26, 43, 0.92) 0%, rgba(11, 18, 32, 0.84) 100%)',
        'gold-shiny': 'linear-gradient(45deg, #BFDBFE 0%, #60A5FA 50%, #BFDBFE 100%)',
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.accent"), 0 0 20px theme("colors.accent")',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'gold-glow': '0 0 10px rgba(59, 130, 246, 0.45), 0 0 20px rgba(59, 130, 246, 0.25)',
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.2" }],
        sm: ["0.875rem", { lineHeight: "1.4" }],
        base: ["0.95rem", { lineHeight: "1.6" }],
        lg: ["1.05rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.4" }],
        "2xl": ["1.5rem", { lineHeight: "1.3" }],
        "3xl": ["1.9rem", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};
