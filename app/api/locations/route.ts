import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LocationStatus } from '@prisma/client'

// GET /api/locations - Get all locations (PUBLIC ACCESS)
export async function GET(request: NextRequest) {
  try {
    // Make GET public - no authentication required
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as LocationStatus | null
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const locations = await prisma.location.findMany({
      where: {
        ...(status && { status }),
        ...(!includeInactive && !status && { status: { not: 'INACTIVE' } })
      },
      include: {
        _count: {
          select: {
            rainfallData: true,
            monthlyAggregates: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ 
      success: true,
      data: locations,
      count: locations.length
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}

// POST /api/locations - Create new location (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can create locations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, status } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' }, 
        { status: 400 }
      )
    }

    // Check if location code already exists
    const existingLocation = await prisma.location.findUnique({
      where: { code }
    })

    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location code already exists' }, 
        { status: 409 }
      )
    }

    // Create new location
    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        status: status || 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Location created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
