import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Command-center dark theme
        background: {
          DEFAULT: "#050a0f",
          secondary: "#0a1120",
          tertiary: "#0f1a2e",
          panel: "#0d1929",
        },
        accent: {
          cyan: "#00d4ff",
          blue: "#1a6bff",
          green: "#00ff88",
          red: "#ff3344",
          orange: "#ff6b00",
          yellow: "#ffd700",
          purple: "#8b5cf6",
        },
        border: {
          DEFAULT: "#1a2a40",
          bright: "#1e3a5f",
        },
        text: {
          primary: "#e0f0ff",
          secondary: "#7a9bbf",
          muted: "#3a5472",
        },
        severity: {
          critical: "#ff0033",
          high: "#ff6600",
          medium: "#ffcc00",
          low: "#00cc66",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan": "scan 4s linear infinite",
        "blink": "blink 1s step-end infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 212, 255, 0.3)",
        "glow-red": "0 0 20px rgba(255, 51, 68, 0.4)",
        "glow-green": "0 0 20px rgba(0, 255, 136, 0.3)",
        panel: "0 4px 30px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
