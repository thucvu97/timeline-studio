import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  images: {
    unoptimized: true,
  },
  distDir: "dist",
  webpack: (config, { isServer }) => {
    // Enable source maps for better bundle analysis
    if (!isServer) {
      config.devtool = "source-map"
    }
    
    // Generate webpack stats for bundle analysis
    if (process.env.ANALYZE === "true") {
      config.stats = {
        all: false,
        assets: true,
        chunks: true,
        modules: true,
        timings: true,
        warnings: true,
        errors: true,
        errorDetails: true,
        entrypoints: true,
        chunkGroups: true,
      }
    }
    
    return config
  },
  experimental: {
    // Enable webpack build worker to speed up builds
    webpackBuildWorker: true,
  },
}

export default nextConfig
