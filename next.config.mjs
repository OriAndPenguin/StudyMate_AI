/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // PDF/PPTX 파서는 서버에서 그대로 require 하도록 번들에서 제외
    serverComponentsExternalPackages: ["unpdf", "jszip"],
  },
};

export default nextConfig;
