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
    const { name, code, description, status } = body

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id }
    })

    if (!existingLocation) {
      return errorResponse('Location not found', { status: 404 })
    }

    // If code is being updated, check for duplicates
    if (code && code !== existingLocation.code) {
      const duplicateCode = await prisma.location.findUnique({
        where: { code: code.trim().toUpperCase() }
      })

      if (duplicateCode) {
        return errorResponse('Location code already exists', { status: 409 })
      }
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status: status as LocationStatus })
      }
    })

    return successResponse(updatedLocation, {
      message: 'Location updated successfully'
    })

  } catch (error) {
    console.error('Error updating location:', error)
    return errorResponse('Internal Server Error')
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

    // Check if location exists
    const location = await prisma.location.findUnique({
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
      return errorResponse('Location not found', { status: 404 })
    }

    // Check if location has related data
    if (location._count.rainfallData > 0) {
      return errorResponse('Cannot delete location with existing rainfall data. Set status to INACTIVE instead.', {
        status: 409,
        details: { rainfallRecords: location._count.rainfallData }
      })
    }

    // Delete location (this will cascade to related thresholds)
    await prisma.location.delete({
      where: { id }
    })

    return successResponse({ id }, {
      message: 'Location deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting location:', error)
    return errorResponse('Internal Server Error')
  }
}
