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
          50: "#fffdf8",
          100: "#faf3e7",
          200: "#f3e6d1",
          300: "#ead6b8"
        },
        coffee: {
          300: "#b88363",
          500: "#8f5a3c",
          700: "#5f3924",
          900: "#2e1a10"
        },
      },
      boxShadow: {
        soft: "0 18px 60px rgba(77, 47, 28, 0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backgroundImage: {
        "hero-wash": "radial-gradient(circle at top left, rgba(233, 205, 173, 0.45), transparent 35%), radial-gradient(circle at bottom right, rgba(143, 90, 60, 0.12), transparent 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
