/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
  transpilePackages: ['pg', 'pg-hstore', 'pg-native', 'src/pages/orcamentos/[id].js'], // Transpile pg and its related packages
  webpack: (config, { isServer, webpack }) => {
    // Add a rule to treat .js files in src/pages as ES modules
    config.module.rules.push({
      test: /\.js$/,
      include: require('path').resolve(__dirname, 'src/pages'),
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        // Add other Node.js built-in modules that might cause issues
      };
    }
    return config;
  },
};

module.exports = nextConfig;