import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/rainfall/bulk - Bulk create rainfall data (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can bulk create rainfall data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { data: bulkData } = await request.json()

    if (!Array.isArray(bulkData) || bulkData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of rainfall data.' },
        { status: 400 }
      )
    }

    const results = {
      total: bulkData.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string; data: any }>
    }

    // Get all locations for validation
    const locations = await prisma.location.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, code: true }
    })

    const locationMap = new Map(locations.map(loc => [loc.code, loc.id]))

    // Process each record
    for (let i = 0; i < bulkData.length; i++) {
      const record = bulkData[i]
      
      try {
        // Validate required fields
        if (!record.date || record.rainfall === undefined || !record.location) {
          throw new Error('Missing required fields: date, rainfall, location')
        }

        // Validate rainfall value
        if (record.rainfall < 0) {
          throw new Error('Rainfall value must be >= 0')
        }

        // Get location ID
        const locationId = locationMap.get(record.location)
        if (!locationId) {
          throw new Error(`Location '${record.location}' not found or inactive`)
        }

        // Check for duplicate
        const existingEntry = await prisma.rainfallData.findFirst({
          where: {
            date: new Date(record.date),
            locationId
          }
        })

        if (existingEntry) {
          throw new Error(`Duplicate entry for date ${record.date} and location ${record.location}`)
        }

        // Create rainfall data
        await prisma.rainfallData.create({
          data: {
            date: new Date(record.date),
            rainfall: parseFloat(record.rainfall),
            locationId,
            userId: session.user.id,
            notes: record.notes || null
          }
        })

        results.success++

      } catch (error) {
        results.failed++
        results.errors.push({
          index: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: record
        })
      }
    }

    const statusCode = results.failed > 0 ? 207 : 201 // 207 = Multi-Status

    return NextResponse.json({
      message: `Bulk import completed. ${results.success} successful, ${results.failed} failed.`,
      results
    }, { status: statusCode })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
