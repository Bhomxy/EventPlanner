import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local dev only: keep cache out of iCloud-synced Desktop .next (fixes ENOENT errors).
  // Vercel requires the default `.next` output directory.
  ...(process.env.VERCEL
    ? {}
    : { distDir: "node_modules/.cache/next" }),
};

export default nextConfig;
