export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/admin', // ✅ Google ne verra jamais ta page admin
      },
    ],
    sitemap: 'https://www.mybelleplagne.fr/sitemap.xml',
  };
}