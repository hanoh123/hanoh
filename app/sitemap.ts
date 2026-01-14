import { MetadataRoute } from 'next'
import { demoTickers } from '@/lib/demo-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pennystockstracker.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/screener`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catalysts`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
  ]

  // Dynamic ticker pages
  const tickerPages = demoTickers.map((ticker) => ({
    url: `${baseUrl}/ticker/${ticker.symbol}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...tickerPages]
}