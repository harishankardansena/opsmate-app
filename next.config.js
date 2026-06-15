/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'winston'],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow node: built-in modules in instrumentation
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        { 'node:dns': 'commonjs dns' },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
