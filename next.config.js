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
}
module.exports = nextConfig
