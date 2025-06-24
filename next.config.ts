import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  images: {
    unoptimized: true,
  },
  distDir: "dist",
  webpack: (config, { isServer }) => {
    // Minimize memory usage during build
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    // Limit parallelism to reduce memory usage
    config.parallelism = 1;
    
    // Disable source maps completely in production
    if (process.env.NODE_ENV === "production") {
      config.devtool = false;
    }
    
    // Limit memory usage for terser
    if (config.optimization.minimizer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.parallel = 1;
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          };
        }
      });
    }
    // Disable source maps in production to reduce memory usage
    if (!isServer && process.env.NODE_ENV === "production") {
      config.devtool = false
    } else if (!isServer) {
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
    // Disable webpack build worker to prevent memory issues
    webpackBuildWorker: false,
    // Reduce memory usage
    workerThreads: false,
    cpus: 1,
  },
  // Disable type checking during build to save memory
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
