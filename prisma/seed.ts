import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { dailyData } from '../lib/data/deprecated/rainfall-data'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data before seeding
    console.log('🧹 Clearing existing data...')
  await prisma.user.deleteMany({})
  await prisma.location.deleteMany({})
  await prisma.rainfallData.deleteMany({})
  await prisma.systemConfig.deleteMany({})

    console.log('✅ Existing data cleared')
  console.log('🌱 Starting database seeding...')

  // Create default admin user
  const hashedPassword = await bcryptjs.hash('admin123', 12)
  
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
      name: 'Tailing dam (TSF)',
      code: 'TSF',
      description: 'Stasiun monitoring di tailing storage facility',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Kencana (Portal)',
      code: 'KNC-PRT',
      description: 'Stasiun monitoring di portal Kencana',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Toguraci (Portal)',
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

  const createdLocations = []
  for (const locationData of defaultLocations) {
    const location = await prisma.location.upsert({
      where: { code: locationData.code },
      update: {},
      create: locationData,
    })
    createdLocations.push(location)
    console.log(`  ✅ Created location: ${location.name} (${location.code})`)
  }

  // Create location code to ID mapping
  const locationMap = new Map(
    createdLocations.map(loc => [loc.code, loc.id])
  )

  console.log('📊 Creating sample rainfall data...')
  
  // Insert sample rainfall data from mock data
  let successCount = 0
  for (const record of dailyData) {
    try {
      const locationId = locationMap.get(record.location)
      if (locationId) {
        await prisma.rainfallData.create({
          data: {
            date: new Date(record.date),
            rainfall: record.rainfall,
            locationId,
            userId: adminUser.id,
            notes: null
          }
        })
        successCount++
      }
    } catch (error) {
      console.warn(`  ⚠️ Skipped duplicate entry for ${record.date} - ${record.location}`)
    }
  }
  
  console.log(`  ✅ Created ${successCount} rainfall data records`)

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
