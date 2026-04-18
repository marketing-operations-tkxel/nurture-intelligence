import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg', 'pg-pool', 'pg-protocol', 'bcryptjs'],
};

export default nextConfig;
