/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set the maximum file size to 10MB
    },
  },
};

module.exports = nextConfig;