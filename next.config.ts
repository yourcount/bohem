import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [68, 72, 75, 76, 78, 80, 85, 92],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com"
      },
      {
        protocol: "https",
        hostname: "*.ytimg.com"
      },
      {
        protocol: "https",
        hostname: "img.youtube.com"
      }
    ]
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://vercel.live https://challenges.cloudflare.com"
      : "'self' 'unsafe-inline' https://www.googletagmanager.com https://vercel.live https://challenges.cloudflare.com";
    const connectSrc = isDev
      ? "'self' https: ws: wss: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://challenges.cloudflare.com"
      : "'self' https: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://challenges.cloudflare.com";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https:",
      "media-src 'self' https:",
      "font-src 'self' data: https:",
      `script-src ${scriptSrc}`,
      `script-src-elem ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-src https://open.spotify.com https://*.spotify.com https://www.youtube-nocookie.com https://www.youtube.com https://vercel.live https://challenges.cloudflare.com",
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
