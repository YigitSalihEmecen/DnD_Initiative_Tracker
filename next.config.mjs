/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '',
}

export default nextConfig 