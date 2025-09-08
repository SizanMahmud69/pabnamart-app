
import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'share.google',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'pix1.wapkizfile.info',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const swDest = path.join(__dirname, 'public', 'firebase-messaging-sw.js');
      config.resolve.alias['firebase/messaging'] = path.resolve(
        __dirname,
        'node_modules/firebase/messaging'
      );
    }
    return config;
  },
};

export default nextConfig;
