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
        navy: "#0F2044",
        coral: "#FF5C3A",
        "coral-light": "#FF8066",
        cream: "#FAF8F5",
        "navy-dimmed": "rgba(255,255,255,0.35)",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      borderRadius: {
        chip: "44px",
        card: "16px",
        btn: "12px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(15,32,68,0.08)",
        "card-hover": "0 8px 32px rgba(15,32,68,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
