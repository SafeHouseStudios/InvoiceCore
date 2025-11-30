import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* * CRITICAL FOR SELF-HOSTING: 
   * 'standalone' creates a small node server in .next/standalone 
   * that doesn't need the massive node_modules folder to run.
   */
  output: "standalone",

  /* * Strict Mode helps catch React bugs during dev.
   */
  reactStrictMode: true,

  /*
   * (Optional) These settings stop the build from failing 
   * if you have small linting/type errors. 
   * Keep these true for rapid development, remove for strict production.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  /*
   * If you plan to use standard <img> tags or remote images later
   */
  images: {
    unoptimized: true, // Easier for local file handling on VPS
  }
};

export default nextConfig;