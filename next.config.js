/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/user/dashboard',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig