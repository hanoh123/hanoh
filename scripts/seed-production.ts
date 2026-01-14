/**
 * Production Database Seed Script
 * Minimal, safe seed for production environment
 * Only creates essential data if not already present
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedProduction() {
  console.log('🌱 Starting production database seed...')
  console.log('⚠️  Production seed is minimal and safe - only creates missing essentials')
  console.log()

  try {
    // Check if any users exist
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      console.log('📝 No users found - creating initial admin user...')
      
      // Get admin credentials from environment or use defaults (should be changed immediately)
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@pennystocks.local'
      const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
      
      if (adminPassword === 'ChangeMe123!') {
        console.warn('⚠️  WARNING: Using default admin password - CHANGE IMMEDIATELY after first login!')
      }
      
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          verified: true
        }
      })
      
      console.log(`✅ Created admin user: ${admin.email}`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   ⚠️  IMPORTANT: Change password immediately after first login!`)
      console.log()
    } else {
      console.log(`✅ Users already exist (${userCount} users) - skipping user creation`)
      console.log()
    }

    // Check if any tickers exist
    const tickerCount = await prisma.ticker.count()
    
    if (tickerCount === 0) {
      console.log('📝 No tickers found - creating sample tickers...')
      
      const sampleTickers = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          exchange: 'NASDAQ',
          currentPrice: 150.00,
          volume: 50000000
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          sector: 'Technology',
          exchange: 'NASDAQ',
          currentPrice: 400.00,
          volume: 30000000
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          sector: 'Technology',
          exchange: 'NASDAQ',
          currentPrice: 140.00,
          volume: 25000000
        }
      ]
      
      for (const ticker of sampleTickers) {
        await prisma.ticker.create({ data: ticker })
        console.log(`   ✅ Created ticker: ${ticker.symbol}`)
      }
      
      console.log(`✅ Created ${sampleTickers.length} sample tickers`)
      console.log()
    } else {
      console.log(`✅ Tickers already exist (${tickerCount} tickers) - skipping ticker creation`)
      console.log()
    }

    // Summary
    const finalUserCount = await prisma.user.count()
    const finalTickerCount = await prisma.ticker.count()
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    
    console.log('📊 Production Database Summary:')
    console.log(`   Users: ${finalUserCount} (${adminCount} admin)`)
    console.log(`   Tickers: ${finalTickerCount}`)
    console.log()
    
    console.log('✅ Production seed completed successfully!')
    console.log()
    
    if (adminCount > 0) {
      console.log('🔐 Next Steps:')
      console.log('   1. Login with admin credentials')
      console.log('   2. Change admin password immediately')
      console.log('   3. Add production tickers via admin panel or CSV import')
      console.log('   4. Configure alerts and catalysts as needed')
    }
    
  } catch (error) {
    console.error('❌ Production seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedProduction()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })