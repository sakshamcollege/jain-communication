import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// Runtime caching configuration for PWA
const runtimeCaching = [
  {
    // Cache API routes with network-first strategy
    urlPattern: /^https?:\/\/.*\/api\/.*$/,
    handler: "NetworkFirst" as const,
    options: {
      cacheName: "api-cache",
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      networkTimeoutSeconds: 10,
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    // Cache images with cache-first strategy
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "image-cache",
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  {
    // Cache fonts with cache-first strategy
    urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "font-cache",
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      },
    },
  },
  {
    // Cache CSS and JS with stale-while-revalidate
    urlPattern: /\.(?:js|css)$/,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "static-resources",
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    // Cache page navigations with network-first
    urlPattern: /^https?:\/\/.*\/(?:dashboard|sales|products|recharges|reports).*$/,
    handler: "NetworkFirst" as const,
    options: {
      cacheName: "pages-cache",
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      networkTimeoutSeconds: 10,
    },
  },
  {
    // Default handler for other requests
    urlPattern: /.*/,
    handler: "NetworkFirst" as const,
    options: {
      cacheName: "default-cache",
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      networkTimeoutSeconds: 10,
    },
  },
];

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
});

const nextConfig: NextConfig = {
  // Turbopack disabled to allow next-pwa to generate service worker
  // next-pwa uses webpack plugins which are incompatible with Turbopack
};

// @ts-expect-error - next-pwa types are incompatible with Next.js 16
export default withPWA(nextConfig);
