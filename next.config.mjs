import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Pin the project root so Next doesn't pick up the stray ~/package-lock.json.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) }
};
export default nextConfig;
