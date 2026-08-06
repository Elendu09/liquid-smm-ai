import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Brand colors
        brand: {
          blue: "hsl(var(--brand-blue))",
          "blue-glow": "hsl(var(--brand-blue-glow))",
          purple: "hsl(var(--brand-purple))",
          cyan: "hsl(var(--brand-cyan))",
          green: "hsl(var(--brand-green))",
          orange: "hsl(var(--brand-orange))",
          pink: "hsl(var(--brand-pink))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(217 91% 60% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(217 91% 60% / 0.6)" },
        },
        "data-flow": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-20px)", opacity: "0" },
        },
        // Liquid Glass micro-interactions
        "liquid-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "liquid-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "liquid-glow-pulse": {
          "0%, 100%": {
            opacity: "0.5",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.9",
            transform: "scale(1.05)",
          },
        },
        "liquid-specular": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "liquid-rise": {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "liquid-tap": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.96)" },
        },
        "liquid-orb": {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "0.55",
          },
          "33%": {
            transform: "translate(30px, -20px) scale(1.06)",
            opacity: "0.75",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.95)",
            opacity: "0.6",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "data-flow": "data-flow 1s ease-out infinite",
        "liquid-shimmer": "liquid-shimmer 2.4s linear infinite",
        "liquid-float": "liquid-float 6s ease-in-out infinite",
        "liquid-glow-pulse": "liquid-glow-pulse 4s ease-in-out infinite",
        "liquid-specular": "liquid-specular 1.6s ease-in-out infinite",
        "liquid-rise": "liquid-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "liquid-tap": "liquid-tap 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        "liquid-orb": "liquid-orb 14s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        // Liquid glass shadows — softer, more multi-layered than `shadow-lg`
        glass: "0 1px 0 0 hsl(var(--foreground) / 0.04) inset, 0 8px 24px -12px hsl(220 40% 12% / 0.18)",
        "glass-lg":
          "0 1px 0 0 hsl(var(--foreground) / 0.05) inset, 0 24px 48px -24px hsl(220 40% 12% / 0.28)",
        "glass-float":
          "0 1px 0 0 hsl(var(--foreground) / 0.06) inset, 0 32px 64px -28px hsl(220 40% 12% / 0.35), 0 2px 6px hsl(220 40% 12% / 0.04)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.16), 0 8px 24px -8px hsl(var(--primary) / 0.35)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
