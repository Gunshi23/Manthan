/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        orbit: {
          bg: "#050816",
          card: "#111827",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          success: "#22C55E",
          lightBg: "#F9FAFB",
          lightCard: "#FFFFFF",
          lightBorder: "#E5E7EB",
          lightText: "#111827",
          darkBorder: "#1F2937",
        }
      },
      fontFamily: {
        space: ["'Space Grotesk'", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "orbit-pulse": "orbitPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "orbit-spin-slow": "spin 30s linear infinite",
        "orbit-spin-reverse": "spin-reverse 20s linear infinite",
        "radar-sweep": "radarSweep 6s linear infinite",
        "scan-line": "scanLine 8s linear infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        orbitPulse: {
          "0%, 100%": { opacity: 0.15, transform: "scale(1)" },
          "50%": { opacity: 0.45, transform: "scale(1.05)" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        radarSweep: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" }
        },
        fadeInUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        }
      },
      boxShadow: {
        "orbit-glow": "0 0 20px rgba(59, 130, 246, 0.15)",
        "orbit-glow-purple": "0 0 20px rgba(139, 92, 246, 0.2)",
        "orbit-glow-green": "0 0 20px rgba(34, 197, 94, 0.2)",
        "orbit-glow-inset": "inset 0 0 15px rgba(59, 130, 246, 0.1)",
      }
    },
  },
  plugins: [],
}
