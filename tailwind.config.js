/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: "#1E4D3A",
          800: "#2F6F57",
          700: "#6E9F87"
        },
        accent: {
          emerald: "#2F6F57",
          teal: "#6E9F87",
          cyan: "#A9CBB7",
          gold: "#C9A227"
        },
        clinical: {
          blue: "#2F6F57",
          success: "#2F6F57",
          warning: "#C9A227",
          danger: "#8C6A5A"
        },
        card: {
          DEFAULT: "#F4F1EB",
          soft: "#E8E3DA"
        },
        text: {
          primary: "#1E4D3A",
          secondary: "#2F6F57",
          muted: "#6E9F87"
        }
      },
      backgroundImage: {
        "medical-gradient": "linear-gradient(135deg, #2F6F57 0%, #6E9F87 100%)",
        "card-soft-gradient": "linear-gradient(180deg, #F4F1EB 0%, #E8E3DA 100%)",
        "premium-button-gradient": "linear-gradient(135deg, #C9A227 0%, #E6C65C 100%)",
      },
      boxShadow: {
        glow: "0 8px 20px rgba(47,111,87,0.12)",
        card: "0 8px 20px rgba(0,0,0,0.04)",
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
