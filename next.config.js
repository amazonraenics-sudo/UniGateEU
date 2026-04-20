/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dbpslhovztmfwyoxrjee.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/', destination: '/login', permanent: false },
    ]
  },
}
module.exports = nextConfig
