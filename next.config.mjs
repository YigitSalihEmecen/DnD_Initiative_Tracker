/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '',
  
  // Always embed Firebase credentials for GitHub Pages
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyD0Jw9TdyBMUVwfHLyTHE09dNZkVFn7yrI',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'encountertracker-13662.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'encountertracker-13662',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'encountertracker-13662.firebasestorage.app',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '975572155272',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:975572155272:web:57fdbde866e8ff83ae8b9b',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-9XZTDK90WF',
  },
}

export default nextConfig // Test change to trigger fresh deployment
