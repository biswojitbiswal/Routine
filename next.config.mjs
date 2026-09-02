/** @type {import('next').NextConfig} */
const nextConfig = {
  // OneDrive can interfere with Next's conventional hidden .next directory.
  // Keep the workaround local to `next dev`; Vercel requires the standard
  // production `.next` directory to locate routes-manifest.json.
  distDir: process.env.NODE_ENV === "development" ? "next-build" : ".next",
};

export default nextConfig;
