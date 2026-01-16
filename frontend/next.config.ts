import type { NextConfig } from "next";

const basePath = "/game";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  // Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
