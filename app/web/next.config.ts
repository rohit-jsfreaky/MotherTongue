import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is per-user and auth-gated on almost every route, so we use classic dynamic rendering.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "hgqopwohorjlftowghsi.supabase.co", pathname: "/storage/v1/object/**" }],
  },
};

export default nextConfig;
