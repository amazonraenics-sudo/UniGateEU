import { MetadataRoute } from 'next'

const APP_URL = 'https://www.unigateu.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/login'],
        disallow: [
          '/dashboard',
          '/admin',
          '/api/',
          '/auth/',
          '/onboarding',
          '/universities',
          '/applications',
          '/documents',
          '/sop',
          '/scholarships',
          '/visa',
          '/interview-prep',
          '/financial-aid',
          '/document-checklist',
          '/credits',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
