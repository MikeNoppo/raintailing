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

    // Use transaction to ensure atomicity
    try {
      const location = await prisma.$transaction(async (tx) => {
        // Check if location code already exists
        const existingLocation = await tx.location.findUnique({
          where: { code: code.trim().toUpperCase() }
        })

        if (existingLocation) {
          throw new Error('Location code already exists')
        }

        // Create new location
        return await tx.location.create({
          data: {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description?.trim() || null,
            status: status || 'ACTIVE'
          }
        })
      })

      return createdResponse(location, {
        message: 'Location created successfully'
      })
    } catch (error) {
      console.error('Create location error:', error)
      
      // Handle transaction-specific errors
      if (error instanceof Error && error.message.includes('already exists')) {
        return errorResponse(error.message, { status: 409 })
      }
      
      return errorResponse('Internal server error')
    }
  } catch (error) {
    console.error('Create location request error:', error)
    return errorResponse('Failed to process request')
  }
}
