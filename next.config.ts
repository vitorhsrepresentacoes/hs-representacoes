import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keeps builds reliable on small CI/WSL runners; Vercel can still parallelize requests at runtime.
    cpus: 1,
  },
};

export default nextConfig;
