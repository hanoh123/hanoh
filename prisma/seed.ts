import { PrismaClient } from '@prisma/client'
import { demoTickers, demoCatalysts, demoPriceHistory } from '../lib/demo-data'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.alertEvent.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.watchlist.deleteMany()
  await prisma.news.deleteMany()
  await prisma.catalyst.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.ticker.deleteMany()
  await prisma.importJob.deleteMany()
  
  // Keep users for continuity
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@pennystocks.com' }
  })

  if (!adminUser) {
    console.log('Creating admin user...')
    await prisma.user.create({
      data: {
        email: 'admin@pennystocks.com',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3/Hm', // password: admin123
        role: 'ADMIN',
        verified: true,
      }
    })
  }

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@pennystocks.com' }
  })

  // Create tickers with audit fields
  console.log('Creating tickers...')
  for (const ticker of demoTickers) {
    await prisma.ticker.create({
      data: {
        symbol: ticker.symbol,
        name: ticker.name,
        sector: ticker.sector,
        marketCap: ticker.marketCap,
        float: ticker.float,
        sharesOutstanding: ticker.sharesOutstanding,
        currentPrice: ticker.currentPrice,
        volume: ticker.volume,
        change24h: ticker.change24h,
        changePercent24h: ticker.changePercent24h,
        createdBy: admin?.id,
        updatedBy: admin?.id,
      }
    })
  }

  // Get created tickers for relationships
  const createdTickers = await prisma.ticker.findMany()
  const tickerMap = new Map(createdTickers.map(t => [t.symbol, t.id]))

  // Create price history for SNDL (demo ticker)
  console.log('Creating price history...')
  const sndlId = tickerMap.get('SNDL')
  if (sndlId) {
    for (const price of demoPriceHistory) {
      await prisma.priceHistory.create({
        data: {
          tickerId: sndlId,
          date: new Date(price.date),
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: price.volume,
        }
      })
    }
  }

  // Create catalysts with audit fields
  console.log('Creating catalysts...')
  for (const catalyst of demoCatalysts) {
    const tickerId = tickerMap.get(catalyst.ticker.symbol)
    if (tickerId) {
      await prisma.catalyst.create({
        data: {
          tickerId,
          title: catalyst.title,
          description: catalyst.description,
          date: catalyst.date,
          category: catalyst.category,
          impactLevel: catalyst.impactLevel,
          createdBy: admin?.id,
          updatedBy: admin?.id,
        }
      })
    }
  }

  // Create sample news with deduplication
  console.log('Creating sample news...')
  const sampleNews = [
    {
      tickerId: tickerMap.get('AAPL'),
      headline: 'Apple Reports Strong Q4 Earnings',
      summary: 'Apple Inc. reported better-than-expected quarterly earnings driven by strong iPhone sales.',
      source: 'Reuters',
      url: 'https://reuters.com/apple-q4-earnings',
      publishedAt: new Date('2024-01-15')
    },
    {
      tickerId: tickerMap.get('TSLA'),
      headline: 'Tesla Announces New Gigafactory Location',
      summary: 'Tesla reveals plans for new manufacturing facility to meet growing demand.',
      source: 'Bloomberg',
      url: 'https://bloomberg.com/tesla-gigafactory',
      publishedAt: new Date('2024-01-10')
    }
  ]

  for (const news of sampleNews) {
    if (news.tickerId) {
      const urlHash = news.url ? crypto.createHash('sha256').update(news.url).digest('hex') : null
      await prisma.news.create({
        data: {
          tickerId: news.tickerId,
          headline: news.headline,
          summary: news.summary,
          source: news.source,
          url: news.url,
          urlHash,
          publishedAt: news.publishedAt,
          createdBy: admin?.id,
          updatedBy: admin?.id,
        }
      })
    }
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })