import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const config: NextConfig = {
  /* config options here */
};

const nextConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(config);

export default nextConfig;
