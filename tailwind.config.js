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
        Manthan: {
          bg: "#050816",
          card: "#0F172A",
          elevated: "#1E293B",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          success: "#22C55E",
          amber: "#F59E0B",
          pink: "#EC4899",
          lightBg: "#F9FAFB",
          lightCard: "#FFFFFF",
          lightBorder: "#E5E7EB",
          lightText: "#111827",
          darkBorder: "rgba(255, 255, 255, 0.08)",
        },
        agent: {
          drishti: "#3B82F6",
          pragya:  "#F59E0B",
          khoj:    "#8B5CF6",
          rachna:  "#EC4899",
          saarthi: "#22C55E",
        },
        gray: {
          950: "#050816",
          900: "#0F172A",
          850: "#162032",
          800: "#1E293B",
        }
      },
      fontFamily: {
        space: ["'Space Grotesk'", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "orbit-pulse":        "orbitPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "orbit-spin-slow":    "spin 30s linear infinite",
        "orbit-spin-reverse": "spin-reverse 20s linear infinite",
        "radar-sweep":        "radarSweep 6s linear infinite",
        "scan-line":          "scanLine 8s linear infinite",
        "pulse-fast":         "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up":         "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer":            "shimmer 3s ease-in-out infinite",
        "glow-pulse":         "glowPulse 2s ease-in-out infinite",
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
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glowPulse: {
          "0%, 100%": { opacity: 0.7 },
          "50%": { opacity: 1 },
        },
      },
      boxShadow: {
        /* Standard glows */
        "orbit-glow":         "0 0 30px rgba(59, 130, 246, 0.35)",
        "orbit-glow-purple":  "0 0 30px rgba(139, 92, 246, 0.35)",
        "orbit-glow-green":   "0 0 30px rgba(34, 197, 94, 0.35)",
        "orbit-glow-amber":   "0 0 30px rgba(245, 158, 11, 0.35)",
        "orbit-glow-pink":    "0 0 30px rgba(236, 72, 153, 0.35)",
        "orbit-glow-inset":   "inset 0 0 20px rgba(59, 130, 246, 0.12)",
        /* Hero-strength glows for dominant cards */
        "orbit-glow-hero":    "0 0 60px rgba(59, 130, 246, 0.40), 0 0 120px rgba(59, 130, 246, 0.15)",
        "orbit-glow-hero-purple": "0 0 60px rgba(139,92,246,0.40), 0 0 120px rgba(139,92,246,0.15)",
        "orbit-glow-hero-green":  "0 0 60px rgba(34,197,94,0.40), 0 0 120px rgba(34,197,94,0.15)",
        "orbit-glow-hero-amber":  "0 0 60px rgba(245,158,11,0.40), 0 0 120px rgba(245,158,11,0.15)",
        "orbit-glow-hero-pink":   "0 0 60px rgba(236,72,153,0.40), 0 0 120px rgba(236,72,153,0.15)",
      }
    },
  },
  plugins: [],
}
