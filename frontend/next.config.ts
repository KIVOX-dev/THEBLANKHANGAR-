import type { NextConfig } from "next";

const assetUrl = process.env.NEXT_PUBLIC_ASSET_URL ?? "http://localhost:4000";
const assetHost = new URL(assetUrl);

const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(assetHost.hostname);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: assetHost.protocol.replace(":", "") as "http" | "https",
        hostname: assetHost.hostname,
        port: assetHost.port,
        pathname: "/uploads/**",
      },
    ],
    // The asset host comes from a trusted, admin-configured env var (never user input), so
    // this doesn't carry the SSRF risk the flag is named for — it's only needed because the
    // backend runs on localhost/a private IP in dev (and possibly same-VPC in prod).
    ...(isLocalHost && { dangerouslyAllowLocalIP: true }),
  },
};

export default nextConfig;
