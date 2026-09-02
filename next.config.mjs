/** @type {import('next').NextConfig} */
const nextConfig = {
  // OneDrive can interfere with Next's conventional hidden .next directory.
  // A normal directory name avoids its special-file synchronization behavior.
  distDir: "next-build",
};

export default nextConfig;
