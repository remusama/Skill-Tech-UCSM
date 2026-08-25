import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors are now enforced. Fix any TypeScript errors before building for production.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
