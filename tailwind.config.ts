import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: "#FDFBF7",
          100: "#F9F5ED",
          200: "#F3EDE0",
          300: "#E8DFD0",
        },
        gold: {
          50: "#FBF7F0",
          100: "#F5EBD9",
          200: "#E8D4B0",
          300: "#D4B87A",
          400: "#C4A574",
          500: "#A88B55",
          600: "#8B7344",
          700: "#6F5B36",
          800: "#4A3D24",
          900: "#2C2416",
        },
        bronze: {
          DEFAULT: "#8B6914",
          dark: "#6B4F10",
        },
        ink: {
          DEFAULT: "#2C2416",
          muted: "#5C5346",
          light: "#8A8174",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "ivory-texture":
          "radial-gradient(ellipse at top, #F9F5ED 0%, #F3EDE0 50%, #E8DFD0 100%)",
        "hero-glow":
          "linear-gradient(135deg, rgba(196,165,116,0.15) 0%, transparent 50%, rgba(139,105,20,0.08) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
