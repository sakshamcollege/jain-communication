import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Turbopack disabled to allow next-pwa to generate service worker
  // next-pwa uses webpack plugins which are incompatible with Turbopack
};

// @ts-expect-error - next-pwa types are incompatible with Next.js 16
export default withPWA(nextConfig);
