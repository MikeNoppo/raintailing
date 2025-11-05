import { NextRequest } from 'next/server'
import { LocationStatus } from '@prisma/client'

import { requireAdmin } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'
import type { RouteContext } from '@/lib/types'

// GET /api/locations/[id] - Get specific location (PUBLIC ACCESS)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Make GET public - no authentication required
    const { id } = await context.params

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rainfallData: true
          }
        },
        rainfallData: {
          select: {
            date: true,
            rainfall: true
          },
          orderBy: { date: 'desc' },
          take: 10 // Last 10 records
        }
      }
    })

    if (!location) {
      return errorResponse('Location not found', { status: 404 })
    }

    return successResponse(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return errorResponse('Internal Server Error')
  }
}

// PATCH /api/locations/[id] - Update location (ADMIN ONLY)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return authResult.error
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, code, description, latitude, longitude, status } = body

    if (latitude !== undefined && latitude !== null && (latitude < -90 || latitude > 90)) {
      return errorResponse('Latitude must be between -90 and 90', { status: 400 })
    }

    if (longitude !== undefined && longitude !== null && (longitude < -180 || longitude > 180)) {
      return errorResponse('Longitude must be between -180 and 180', { status: 400 })
    }

    try {
      const updatedLocation = await prisma.$transaction(async (tx) => {
        const existingLocation = await tx.location.findUnique({
          where: { id }
        })

        if (!existingLocation) {
          throw new Error('Location not found')
        }

        if (code && code !== existingLocation.code) {
          const duplicateCode = await tx.location.findUnique({
            where: { code: code.trim().toUpperCase() }
          })

          if (duplicateCode) {
            throw new Error('Location code already exists')
          }
        }

        return await tx.location.update({
          where: { id },
          data: {
            ...(name && { name: name.trim() }),
            ...(code && { code: code.trim().toUpperCase() }),
            ...(description !== undefined && { description: description?.trim() || null }),
            ...(latitude !== undefined && { latitude: latitude !== null ? parseFloat(latitude) : null }),
            ...(longitude !== undefined && { longitude: longitude !== null ? parseFloat(longitude) : null }),
            ...(status && { status: status as LocationStatus })
          }
        })
      })

      return successResponse(updatedLocation, {
        message: 'Location updated successfully'
      })
    } catch (error) {
      console.error('Update location error:', error)
      
      // Handle transaction-specific errors
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return errorResponse(error.message, { status: 404 })
        }
        if (error.message.includes('already exists')) {
          return errorResponse(error.message, { status: 409 })
        }
      }
      
      return errorResponse('Internal server error')
    }
  } catch (error) {
    console.error('Update location request error:', error)
    return errorResponse('Failed to process request')
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return authResult.error
    }

    const { id } = await context.params

    // Use transaction to ensure atomicity
    try {
      await prisma.$transaction(async (tx) => {
        // Check if location exists
        const location = await tx.location.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                rainfallData: true
              }
            }
          }
        })

        if (!location) {
          throw new Error('Location not found')
        }

        // Check if location has related data
        if (location._count.rainfallData > 0) {
          throw new Error(`Cannot delete location with existing rainfall data. Set status to INACTIVE instead.|${location._count.rainfallData}`)
        }

        // Delete location (this will cascade to related thresholds)
        await tx.location.delete({
          where: { id }
        })
      })

      return successResponse({ id }, {
        message: 'Location deleted successfully'
      })
    } catch (error) {
      console.error('Delete location error:', error)
      
      // Handle transaction-specific errors
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return errorResponse('Location not found', { status: 404 })
        }
        if (error.message.includes('Cannot delete location')) {
          const [message, count] = error.message.split('|')
          return errorResponse(message, {
            status: 409,
            details: { rainfallRecords: parseInt(count) }
          })
        }
      }
      
      return errorResponse('Internal server error')
    }
  } catch (error) {
    console.error('Delete location request error:', error)
    return errorResponse('Failed to process request')
  }
}
