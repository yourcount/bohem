import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [72, 75, 76, 78, 80, 85, 92],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com"
      }
    ]
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";
    const connectSrc = isDev ? "'self' https: ws: wss:" : "'self' https:";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "font-src 'self' data: https:",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-src https://open.spotify.com https://*.spotify.com",
      "upgrade-insecure-requests"
    ].join("; ");

    const baseHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ];
    if (!isDev) {
      baseHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" });
    }

    return [
      {
        source: "/:path*",
        headers: baseHeaders
      }
    ];
  }
};

export default nextConfig;
