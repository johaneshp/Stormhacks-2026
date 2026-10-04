import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this directory so Next.js doesn't get confused
  // by an unrelated package-lock.json further up the filesystem tree.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
