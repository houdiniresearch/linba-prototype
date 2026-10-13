import type { NextConfig } from "next";
import { localAddresses } from "./lib/network";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", ...localAddresses()],
};
export default nextConfig;
