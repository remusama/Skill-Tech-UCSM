import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite acceso desde la red local (otros dispositivos en la misma red)
  allowedDevOrigins: [
    "192.168.18.53",
    "http://192.168.18.53",
    "http://192.168.18.53:3000",
  ],
  typescript: {
    // Type errors are now enforced. Fix any TypeScript errors before building for production.
    ignoreBuildErrors: false,
  },
  images: {
    // Optimización activa: Next.js sirve WebP/AVIF automáticamente
    formats: ["image/avif", "image/webp"],
    unoptimized: false,
  },
};

export default withPWA(nextConfig);
