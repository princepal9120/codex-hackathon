/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native C++ addon — must not be bundled by Next.js.
  serverExternalPackages: ['better-sqlite3'],
}

module.exports = nextConfig
