import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { createdResponse, errorResponse, successResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'
import { parseDateOnly } from '@/lib/utils/date-helpers'

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

    const startBoundary = parseDateOnly(startDate)
    const endBoundary = parseDateOnly(endDate, { endOfDay: true })

    if (startBoundary || endBoundary) {
      where.date = {}
      if (startBoundary) {
        where.date.gte = startBoundary
      }
      if (endBoundary) {
        where.date.lte = endBoundary
      }
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
            id: false,
            code: true,
            name: true,
            status: false
          }
        }
      },
      orderBy: {
        [sortBy]: order
      },
      skip: offset,
      take: limit
    })

    return successResponse({
      records: data,
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
    return errorResponse('Internal server error')
  }
}

// POST /api/rainfall - Create rainfall data (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult.error
    }

    const { user } = authResult

    // Only ADMIN can create rainfall data
    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden - Admin access required', { status: 403 })
    }

    const { date, rainfall, locationId, notes } = await request.json()

    // Validate required fields
    if (!date || rainfall === undefined || !locationId) {
      return errorResponse('Missing required fields: date, rainfall, locationId', { status: 400 })
    }

    // Validate rainfall value
    if (rainfall < 0) {
      return errorResponse('Rainfall value must be >= 0', { status: 400 })
    }

    // Use transaction to ensure data consistency
    const rainfallData = await prisma.$transaction(async (tx) => {
      // Validate location exists and is active
      const location = await tx.location.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        throw new Error('Location not found')
      }

      if (location.status !== 'ACTIVE') {
        throw new Error('Location is not active')
      }

      // Check for duplicate entry (same date and location)
      const existingEntry = await tx.rainfallData.findFirst({
        where: {
          date: new Date(date),
          locationId
        }
      })

      if (existingEntry) {
        throw new Error('Rainfall data for this date and location already exists')
      }

      // Create rainfall data
      return await tx.rainfallData.create({
        data: {
          date: new Date(date),
          rainfall: parseFloat(rainfall),
          locationId,
          userId: user.id,
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
    })

    return createdResponse(rainfallData, {
      message: 'Rainfall data created successfully'
    })

  } catch (error) {
    console.error('Create rainfall data error:', error)
    
    // Handle custom error messages from transaction
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(error.message, { status: 404 })
      }
      if (error.message.includes('not active')) {
        return errorResponse(error.message, { status: 400 })
      }
      if (error.message.includes('already exists')) {
        return errorResponse(error.message, { status: 409 })
      }
    }
    
    return errorResponse('Internal server error')
  }
}
