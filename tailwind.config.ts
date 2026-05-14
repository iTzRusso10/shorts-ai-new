import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 60px rgba(124,58,237,0.5), 0 4px 24px rgba(124,58,237,0.15)",
        "glow-sm": "0 0 20px rgba(124,58,237,0.4)",
        "glow-green":
          "0 0 40px rgba(16,185,129,0.45), 0 4px 16px rgba(16,185,129,0.15)",
        card: "0 0 0 1px rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.5)",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards",
        float: "float 9s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "step-shimmer": "stepShimmer 2.2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-22px) scale(1.025)" },
        },
        pulseGlow: {
          "0%,100%": {
            boxShadow:
              "0 0 16px rgba(124,58,237,0.2), inset 0 0 16px rgba(124,58,237,0.04)",
          },
          "50%": {
            boxShadow:
              "0 0 50px rgba(124,58,237,0.55), inset 0 0 24px rgba(124,58,237,0.09)",
          },
        },
        stepShimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(350%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
