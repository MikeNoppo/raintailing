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

    // Validate rainfall value if provided
    if (rainfall !== undefined && rainfall < 0) {
      return errorResponse('Rainfall value must be >= 0', { status: 400 })
    }

    // Use transaction to ensure data consistency during update
    try {
      const updatedData = await prisma.$transaction(async (tx) => {
        // Check if rainfall data exists
        const existingData = await tx.rainfallData.findUnique({
          where: { id }
        })

        if (!existingData) {
          throw new Error('Rainfall data not found')
        }

        // Validate location exists and is active if location is being changed
        if (locationId && locationId !== existingData.locationId) {
          const location = await tx.location.findUnique({
            where: { id: locationId }
          })

          if (!location) {
            throw new Error('Location not found')
          }

          if (location.status !== 'ACTIVE') {
            throw new Error('Location is not active')
          }
        }

        // Check for duplicate entry if date or location is changing
        if (date || locationId) {
          const checkDate = date ? parseISODate(date) : existingData.date
          const checkLocationId = locationId || existingData.locationId

          const duplicateEntry = await tx.rainfallData.findFirst({
            where: {
              AND: [
                { id: { not: id } },
                { date: checkDate },
                { locationId: checkLocationId }
              ]
            }
          })

          if (duplicateEntry) {
            throw new Error('Rainfall data for this date and location already exists')
          }
        }

        // Update rainfall data
        return await tx.rainfallData.update({
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
      })

      return successResponse(updatedData, {
        message: 'Rainfall data updated successfully'
      })
    } catch (error) {
      console.error('Update rainfall data error:', error)
      
      // Handle transaction-specific errors
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
  } catch (error) {
    console.error('Update rainfall data request error:', error)
    return errorResponse('Failed to process request')
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

    // Use transaction to ensure atomicity
    try {
      await prisma.$transaction(async (tx) => {
        // Check if rainfall data exists
        const existingData = await tx.rainfallData.findUnique({
          where: { id }
        })

        if (!existingData) {
          throw new Error('Rainfall data not found')
        }

        // Delete rainfall data
        await tx.rainfallData.delete({
          where: { id }
        })
      })

      return successResponse({ id }, {
        message: 'Rainfall data deleted successfully'
      })
    } catch (error) {
      console.error('Delete rainfall data error:', error)
      
      // Handle transaction-specific errors
      if (error instanceof Error && error.message.includes('not found')) {
        return errorResponse(error.message, { status: 404 })
      }
      
      return errorResponse('Internal server error')
    }
  } catch (error) {
    console.error('Delete rainfall data request error:', error)
    return errorResponse('Failed to process request')
  }
}
