/**
 * Create Admin User Script
 * One-time script to create or promote a user to admin
 * Protected by ADMIN_BOOTSTRAP_SECRET
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createAdminUser() {
  console.log('🔐 Admin User Bootstrap Script')
  console.log('=' .repeat(50))
  console.log()

  try {
    // Verify bootstrap secret if in production
    if (process.env.NODE_ENV === 'production') {
      const secret = await question('Enter ADMIN_BOOTSTRAP_SECRET: ')
      
      if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
        console.error('❌ Invalid bootstrap secret')
        process.exit(1)
      }
      console.log('✅ Bootstrap secret verified')
      console.log()
    }

    // Get email
    const email = await question('Admin email: ')
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address')
      process.exit(1)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Promote existing user
      console.log(`📝 User ${email} already exists`)
      
      if (existingUser.role === 'ADMIN') {
        console.log('✅ User is already an admin')
        
        const changePassword = await question('Change password? (y/n): ')
        
        if (changePassword.toLowerCase() === 'y') {
          const newPassword = await question('New password: ')
          const confirmPassword = await question('Confirm password: ')
          
          if (newPassword !== confirmPassword) {
            console.error('❌ Passwords do not match')
            process.exit(1)
          }
          
          if (newPassword.length < 8) {
            console.error('❌ Password must be at least 8 characters')
            process.exit(1)
          }
          
          const passwordHash = await bcrypt.hash(newPassword, 10)
          
          await prisma.user.update({
            where: { email },
            data: { passwordHash }
          })
          
          console.log('✅ Password updated successfully')
        }
      } else {
        // Promote to admin
        const confirm = await question(`Promote ${email} to ADMIN? (y/n): `)
        
        if (confirm.toLowerCase() !== 'y') {
          console.log('❌ Operation cancelled')
          process.exit(0)
        }
        
        await prisma.user.update({
          where: { email },
          data: { 
            role: 'ADMIN',
            verified: true
          }
        })
        
        console.log(`✅ User ${email} promoted to ADMIN`)
      }
    } else {
      // Create new admin user
      console.log(`📝 Creating new admin user: ${email}`)
      
      const password = await question('Password: ')
      const confirmPassword = await question('Confirm password: ')
      
      if (password !== confirmPassword) {
        console.error('❌ Passwords do not match')
        process.exit(1)
      }
      
      if (password.length < 8) {
        console.error('❌ Password must be at least 8 characters')
        process.exit(1)
      }
      
      const passwordHash = await bcrypt.hash(password, 10)
      
      const admin = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          verified: true
        }
      })
      
      console.log(`✅ Admin user created successfully`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Role: ${admin.role}`)
    }
    
    console.log()
    console.log('✅ Operation completed successfully')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

createAdminUser()