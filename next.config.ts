import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep dev cache out of iCloud-synced Desktop .next (fixes ENOENT on build-manifest.tmp)
  distDir: "node_modules/.cache/next",
};

export default nextConfig;
