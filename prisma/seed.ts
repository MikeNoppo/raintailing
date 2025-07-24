import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data before seeding
    console.log('🧹 Clearing existing data...')
    await prisma.user.deleteMany({})
    await prisma.location.deleteMany({})
    await prisma.rainfallData.deleteMany({})
    await prisma.systemConfig.deleteMany({})
    await prisma.monthlyAggregate.deleteMany({})
    await prisma.rainfallThreshold.deleteMany({})    

    console.log('✅ Existing data cleared')
  console.log('🌱 Starting database seeding...')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', adminUser.username)

  // Create default locations
  const defaultLocations = [
    {
      name: 'Gosowong Pit',
      code: 'GSW-PIT',
      description: 'Stasiun monitoring di area pit Gosowong',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Gosowong Helipad (DP3)',
      code: 'GSW-DP3', 
      description: 'Stasiun monitoring di helipad Gosowong DP3',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Tailing Storage Facility',
      code: 'TSF',
      description: 'Stasiun monitoring di tailing storage facility',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Kencana Portal',
      code: 'KNC-PRT',
      description: 'Stasiun monitoring di portal Kencana',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Toguraci Portal',
      code: 'TGR-PRT',
      description: 'Stasiun monitoring di portal Toguraci',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Gosowong North',
      code: 'GSW-NTH',
      description: 'Stasiun monitoring di area utara Gosowong',
      status: 'ACTIVE' as const,
    },
  ]

  console.log('🏢 Creating default locations...')

  for (const locationData of defaultLocations) {
    const location = await prisma.location.upsert({
      where: { code: locationData.code },
      update: {},
      create: locationData,
    })
    console.log(`  ✅ Created location: ${location.name} (${location.code})`)
  }

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
