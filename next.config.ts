import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Required for PDF.js compatibility
    config.externals = [...(config.externals || []), { canvas: "canvas" }];

    // Disable canvas for PDF.js compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Handle .mjs files properly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
};

export default nextConfig;
