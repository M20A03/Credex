import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-deep": "#0A0A0F",
        "bg-card": "rgba(15, 23, 42, 0.6)",
        "bg-elevated": "rgba(30, 41, 59, 0.8)",
        purple: {
          950: "#3B0764",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      animation: {
        "gradient-shift": "gradient-shift 4s ease infinite",
        "blob-float": "blob-float 20s ease-in-out infinite alternate",
        "orb-pulse": "orb-pulse 2.5s ease-out infinite",
        shimmer: "shimmer-sweep 1.8s ease-in-out infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "blob-float": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(40px, -60px) scale(1.08)" },
          "66%": { transform: "translate(-30px, 40px) scale(0.95)" },
          "100%": { transform: "translate(20px, -20px) scale(1.04)" },
        },
        "orb-pulse": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "shimmer-sweep": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      screens: {
        xs: "320px",
        "3xl": "1800px",
      },
    },
  },
  plugins: [],
};

export default config;
