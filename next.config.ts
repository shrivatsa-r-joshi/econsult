// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-python/:path*",
        destination: "http://127.0.0.1:8000/:path*", // your FastAPI dev URL
      },
    ];
  },
};

export default nextConfig;
