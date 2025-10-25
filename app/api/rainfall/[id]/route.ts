import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { errorResponse, successResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'
import { parseISODate } from '@/lib/utils/date-helpers'
import type { RouteContext } from '@/lib/types'

// GET /api/rainfall/[id] - Get specific rainfall data (PUBLIC ACCESS)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Make GET public - no authentication required
    const { id } = await context.params

    const rainfallData = await prisma.rainfallData.findUnique({
      where: { id },
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

    if (!rainfallData) {
      return errorResponse('Rainfall data not found', { status: 404 })
    }

    return successResponse(rainfallData)

  } catch (error) {
    console.error('Get rainfall data error:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/rainfall/[id] - Update rainfall data (ADMIN ONLY)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult.error
    }

    const { user } = authResult

    // Only ADMIN can update rainfall data
    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden - Admin access required', { status: 403 })
    }

    const { id } = await context.params
    const { date, rainfall, locationId, notes } = await request.json()

    // Check if rainfall data exists
    const existingData = await prisma.rainfallData.findUnique({
      where: { id }
    })

    if (!existingData) {
      return errorResponse('Rainfall data not found', { status: 404 })
    }

    // Validate rainfall value if provided
    if (rainfall !== undefined && rainfall < 0) {
      return errorResponse('Rainfall value must be >= 0', { status: 400 })
    }

    // Validate location exists and is active if location is being changed
    if (locationId && locationId !== existingData.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        return errorResponse('Location not found', { status: 404 })
      }

      if (location.status !== 'ACTIVE') {
        return errorResponse('Location is not active', { status: 400 })
      }

      // Check for duplicate entry if date or location is changing
      if (date || locationId) {
        const checkDate = date ? parseISODate(date) : existingData.date
        const checkLocationId = locationId || existingData.locationId

        const duplicateEntry = await prisma.rainfallData.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              { date: checkDate },
              { locationId: checkLocationId }
            ]
          }
        })

        if (duplicateEntry) {
          return errorResponse('Rainfall data for this date and location already exists', { status: 409 })
        }
      }
    }

    // Update rainfall data
    const updatedData = await prisma.rainfallData.update({
      where: { id },
      data: {
        ...(date && { date: parseISODate(date) }),
        ...(rainfall !== undefined && { rainfall: parseFloat(rainfall) }),
        ...(locationId && { locationId }),
        ...(notes !== undefined && { notes: notes || null }),
        updatedAt: new Date()
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

    return successResponse(updatedData, {
      message: 'Rainfall data updated successfully'
    })

  } catch (error) {
    console.error('Update rainfall data error:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/rainfall/[id] - Delete rainfall data (ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult.error
    }

    const { user } = authResult

    // Only ADMIN can delete rainfall data
    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden - Admin access required', { status: 403 })
    }

    const { id } = await context.params

    // Check if rainfall data exists
    const existingData = await prisma.rainfallData.findUnique({
      where: { id }
    })

    if (!existingData) {
      return errorResponse('Rainfall data not found', { status: 404 })
    }

    // Delete rainfall data
    await prisma.rainfallData.delete({
      where: { id }
    })

    return successResponse({ id }, {
      message: 'Rainfall data deleted successfully'
    })

  } catch (error) {
    console.error('Delete rainfall data error:', error)
    return errorResponse('Internal server error')
  }
}
