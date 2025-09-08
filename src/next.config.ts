
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
    domains: [
      'placehold.co',
      'picsum.photos',
      'share.google',
      'upload.wikimedia.org',
      'pix1.wapkizfile.info',
      'firebasestorage.googleapis.com',
      'i.ibb.co',
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
