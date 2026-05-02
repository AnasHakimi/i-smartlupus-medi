import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        slate: {
          50:  "oklch(0.975 0.006 250)",
          100: "oklch(0.950 0.008 250)",
          200: "oklch(0.910 0.010 250)",
          300: "oklch(0.830 0.012 250)",
          400: "oklch(0.640 0.010 250)",
          500: "oklch(0.530 0.010 250)",
          600: "oklch(0.440 0.010 250)",
          700: "oklch(0.370 0.012 250)",
          800: "oklch(0.280 0.010 250)",
          900: "oklch(0.200 0.008 250)",
          950: "oklch(0.130 0.006 250)",
        },
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        caption: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.005em" }],
        footnote: ["0.8125rem", { lineHeight: "1.125rem" }],
        subhead: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
        callout: ["0.9375rem", { lineHeight: "1.375rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "title-3": ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em" }],
        "title-2": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        "title-1": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        display: ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        none: "none",
        sm: "0 1px 2px rgba(15, 23, 42, 0.04)",
        md: "0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.04)",
        lg: "0 10px 15px rgba(15, 23, 42, 0.08), 0 4px 6px rgba(15, 23, 42, 0.04)",
        ring: "0 0 0 4px rgba(37, 99, 235, 0.12)",
        "ring-dark": "0 0 0 4px rgba(96, 165, 250, 0.18)",
      },
      transitionTimingFunction: {
        "ios-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ios-in": "cubic-bezier(0.7, 0, 0.84, 0)",
        "ios-spring": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        fast: "140ms",
        base: "200ms",
        slow: "300ms",
      },
      minHeight: {
        touch: "48px",
      },
      spacing: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
export default config;
