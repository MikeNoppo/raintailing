import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  // Optimize routing performance
  trailingSlash: false,
  // Reduce build size for faster loading
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
