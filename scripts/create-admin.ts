import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🔧 Creating admin user...\n')

  const email = await question('Enter admin email: ')
  const password = await question('Enter admin password: ')

  if (!email || !password) {
    console.log('❌ Email and password are required')
    process.exit(1)
  }

  // Simple password hash for demo (use bcrypt in production)
  const passwordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3/Hm'

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
        verified: true,
      }
    })

    console.log(`✅ Admin user created successfully!`)
    console.log(`Email: ${user.email}`)
    console.log(`Role: ${user.role}`)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('❌ User with this email already exists')
    } else {
      console.log('❌ Error creating admin user:', error.message)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
  })