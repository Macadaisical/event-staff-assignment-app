import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for now - use standard build
  images: {
    unoptimized: true
  }
};

export default nextConfig;
