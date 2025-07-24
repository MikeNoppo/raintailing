import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/rainfall - Get rainfall data (PUBLIC ACCESS)
export async function GET(request: NextRequest) {
  try {
    // Make GET public - no authentication required
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'date'
    const order = searchParams.get('order') || 'desc'

    // Build where clause
    const where: {
      location?: { code: string }
      date?: { 
        gte?: Date
        lte?: Date 
      }
    } = {}
    
    if (location && location !== 'all') {
      where.location = { code: location }
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.date = { gte: new Date(startDate) }
    } else if (endDate) {
      where.date = { lte: new Date(endDate) }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.rainfallData.count({ where })

    // Get rainfall data
    const data = await prisma.rainfallData.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        [sortBy]: order
      },
      skip: offset,
      take: limit
    })

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get rainfall data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/rainfall - Create rainfall data (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can create rainfall data
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

    const { date, rainfall, locationId, notes } = await request.json()

    // Validate required fields
    if (!date || rainfall === undefined || !locationId) {
      return NextResponse.json(
        { error: 'Missing required fields: date, rainfall, locationId' },
        { status: 400 }
      )
    }

    // Validate rainfall value
    if (rainfall < 0) {
      return NextResponse.json(
        { error: 'Rainfall value must be >= 0' },
        { status: 400 }
      )
    }

    // Validate location exists and is active
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    if (location.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Location is not active' },
        { status: 400 }
      )
    }

    // Check for duplicate entry (same date and location)
    const existingEntry = await prisma.rainfallData.findFirst({
      where: {
        date: new Date(date),
        locationId
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Rainfall data for this date and location already exists' },
        { status: 409 }
      )
    }

    // Create rainfall data
    const rainfallData = await prisma.rainfallData.create({
      data: {
        date: new Date(date),
        rainfall: parseFloat(rainfall),
        locationId,
        userId: session.user.id,
        notes: notes || null
      },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Rainfall data created successfully',
      data: rainfallData
    }, { status: 201 })

  } catch (error) {
    console.error('Create rainfall data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
