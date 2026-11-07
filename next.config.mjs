/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["mongodb"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/article/:slug", destination: "/news/:slug", permanent: true },
      { source: "/articles/:slug", destination: "/news/:slug", permanent: true },
      { source: "/category/:slug/", destination: "/category/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Public pages: short TTL with stale-while-revalidate for CDN efficiency.
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        // Cache static assets aggressively via CDN/browser.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public images, fonts and favicon.
        source: "/:path*.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Account/admin/API routes: never cached.
        source: "/(account|admin|api)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
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
