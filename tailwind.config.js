/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brilliant-blue": "#0700ff",
        "neon-yellow": "#e2fc0b",
        "hot-pink": "#f50a68",
        brilliant: {
          50: "#f0f0ff",
          100: "#e6e6ff",
          200: "#d1d1ff",
          300: "#b3b3ff",
          400: "#8080ff",
          500: "#0700ff",
          600: "#0600e6",
          700: "#0500cc",
          800: "#0400b3",
          900: "#030099",
        },
        neon: {
          50: "#fcffe6",
          100: "#f9ffcc",
          200: "#f5ff99",
          300: "#f0ff66",
          400: "#ecff33",
          500: "#e2fc0b",
          600: "#d4e006",
          700: "#bcc405",
          800: "#a3a804",
          900: "#8a8c03",
        },
        pink: {
          50: "#ffe6f2",
          100: "#ffcce6",
          200: "#ff99cc",
          300: "#ff66b3",
          400: "#ff3399",
          500: "#f50a68",
          600: "#e6095e",
          700: "#cc0854",
          800: "#b3074a",
          900: "#990640",
        },
      },
      fontFamily: {
        headers: ["var(--font-unbounded)", "sans-serif"],
        body: ["var(--font-archivo)", "sans-serif"],
        mono: ["var(--font-inter)", "monospace"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h1: ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h2: ["2rem", { lineHeight: "1.3" }],
        h3: ["1.5rem", { lineHeight: "1.4" }],
        h4: ["1.25rem", { lineHeight: "1.4" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        brilliant: "12px",
        "brilliant-sm": "8px",
        "brilliant-lg": "16px",
        "brilliant-xl": "24px",
      },
      boxShadow: {
        "brilliant-sm": "0 1px 3px rgba(7, 0, 255, 0.08)",
        brilliant: "0 4px 12px rgba(7, 0, 255, 0.12)",
        "brilliant-md": "0 4px 12px rgba(7, 0, 255, 0.12)",
        "brilliant-lg": "0 8px 25px rgba(7, 0, 255, 0.16)",
        "brilliant-xl": "0 16px 40px rgba(7, 0, 255, 0.2)",
        "neon-glow": "0 0 0 3px rgba(226, 252, 11, 0.2)",
        "brilliant-glow": "0 0 0 3px rgba(7, 0, 255, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      transitionTimingFunction: {
        brilliant: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-balance": {
          "text-wrap": "balance",
        },
        ".writing-vertical": {
          "writing-mode": "vertical-rl",
        },
        ".backface-hidden": {
          "backface-visibility": "hidden",
        },
        ".transform-gpu": {
          transform: "translateZ(0)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
