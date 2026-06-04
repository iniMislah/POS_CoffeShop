import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        cream: {
          50: "#FFFFFF",
          100: "#FDFBF7",
          200: "#F6F0E7",
          300: "#E8D8C3",
          400: "#D9C6AF",
          500: "#C8AF93",
        },
        coffee: {
          100: "#F8F1E8",
          200: "#EADBC8",
          300: "#D2BBA4",
          400: "#A5846C",
          500: "#7B5F4D",
          700: "#5A4032",
          800: "#4C352A",
          900: "#3E2C23",
          950: "#31231C",
        },
        caramel: {
          100: "#f7e3bd",
          300: "#e8bd7a",
          500: "#d29647",
        },
        gold: {
          300: "#d6ba75",
          500: "#b9903c",
        },
      },
      boxShadow: {
        soft: "0 18px 48px rgba(90, 64, 50, 0.08)",
        panel: "0 22px 58px rgba(90, 64, 50, 0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backgroundImage: {
        "hero-wash": "radial-gradient(circle at top left, rgba(232, 216, 195, 0.34), transparent 35%), radial-gradient(circle at bottom right, rgba(90, 64, 50, 0.06), transparent 42%)",
        "coffee-panel": "linear-gradient(180deg, rgba(253,251,247,0.94), rgba(232,216,195,0.78))",
      },
    },
  },
  plugins: [],
};

export default config;
