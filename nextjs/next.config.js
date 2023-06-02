/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => [
        {
            source: '/',
            destination: '/chat',
        },
    ],
}

module.exports = nextConfig
