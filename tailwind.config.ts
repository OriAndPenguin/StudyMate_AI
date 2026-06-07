import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 파스텔 스카이(soft) 포인트 컬러 — 차분하고 cozy 한 톤
        brand: {
          50: "#f4f8fd",
          100: "#e7f0fa",
          200: "#cfe1f3",
          300: "#aecbe8",
          400: "#88aedb",
          500: "#6a96cc",
          600: "#557fb8",
          700: "#436594",
        },
        // 따뜻한 크림 배경
        cream: "#faf8f3",
      },
      boxShadow: {
        card: "0 1px 2px rgba(67,101,148,0.05), 0 10px 30px rgba(67,101,148,0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
