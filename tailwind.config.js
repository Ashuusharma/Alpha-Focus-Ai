/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Phase 7B: values updated to the unified light-first navy/blue/green
      // system (keys kept identical — components/dashboard/* and
      // components/result/* consume these keys directly, e.g. text-text-
      // primary, bg-card, shadow-glow — updating values only means no
      // markup changes were needed to repaint that whole component cluster).
      colors: {
        primary: {
          900: "#0B2A4A",
          800: "#123A63",
          700: "#3D5875"
        },
        accent: {
          emerald: "#34D399",
          teal: "#0D9488",
          cyan: "#0071E3",
          gold: "#F0B429"
        },
        clinical: {
          blue: "#0071E3",
          success: "#34D399",
          warning: "#F59E0B",
          danger: "#EF4444"
        },
        card: {
          DEFAULT: "#FFFFFF",
          soft: "#F3F7FC"
        },
        text: {
          primary: "#0B2A4A",
          secondary: "#5B6B7F",
          muted: "#8592A3"
        }
      },
      backgroundImage: {
        "medical-gradient": "linear-gradient(135deg, #0B2A4A 0%, #0071E3 100%)",
        "card-soft-gradient": "linear-gradient(180deg, #FFFFFF 0%, #F3F7FC 100%)",
        "premium-button-gradient": "linear-gradient(135deg, #F0B429 0%, #FFD666 100%)",
      },
      boxShadow: {
        glow: "0 8px 20px rgba(0,113,227,0.16)",
        card: "0 8px 24px rgba(11,42,74,0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
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
