import { NextRequest } from 'next/server'
import { LocationStatus } from '@prisma/client'

import { requireAdmin } from '@/lib/api/auth'
import { successResponse, createdResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'

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
            rainfallData: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { name: 'asc' }
      ]
    })

    return successResponse(locations, {
      meta: {
        count: locations.length
      }
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return errorResponse('Internal Server Error')
  }
}

// POST /api/locations - Create new location (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return authResult.error
    }

    const body = await request.json()
    const { name, code, description, status } = body

    // Validate required fields
    if (!name || !code) {
      return errorResponse('Name and code are required', { status: 400 })
    }

    // Check if location code already exists
    const existingLocation = await prisma.location.findUnique({
      where: { code }
    })

    if (existingLocation) {
      return errorResponse('Location code already exists', { status: 409 })
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

    return createdResponse(location, {
      message: 'Location created successfully'
    })

  } catch (error) {
    console.error('Error creating location:', error)
    return errorResponse('Internal Server Error')
  }
}
