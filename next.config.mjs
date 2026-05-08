/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"]
  },
  experimental: {
    optimizePackageImports: ["date-fns", "lucide-react"]
  }
};

export default nextConfig;
