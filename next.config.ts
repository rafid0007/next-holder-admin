import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo documents itself in README.md; no generated AGENTS.md needed.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
