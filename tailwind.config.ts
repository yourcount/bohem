import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "Times New Roman", "serif"],
        body: ["Manrope", "Avenir Next", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
