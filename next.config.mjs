/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
<<<<<<< HEAD
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      config.externals = config.externals || [];
      config.externals.push("node-cron");
    }

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["node-cron"],
  },
=======
>>>>>>> ca9b783 (first commit)
};

export default nextConfig;
