/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["html5-qrcode"],
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "@napi-rs/canvas"];
    }
    return config;
  },
};

export default nextConfig;
