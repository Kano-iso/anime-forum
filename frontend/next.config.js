/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  async rewrites() {
    // 本地开发使用 ECS 后端，生产环境使用 backend 服务名
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/api/:path*',
        destination: isDev 
          ? 'http://14.103.8.40/api/:path*'  // 本地开发指向 ECS
          : 'http://backend:3001/api/:path*', // Docker 生产环境
      },
    ];
  },
};

module.exports = nextConfig;
