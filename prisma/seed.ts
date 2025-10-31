import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (existingAdmin) {
    console.log('ℹ️  Admin user already exists, skipping creation')
    console.log('✅ Seeding completed - no changes needed')
    return
  }

  // Create default admin user
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcryptjs.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', adminUser.username)
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
