import { NextRequest } from 'next/server'
import { LocationStatus } from '@prisma/client'

import { requireAdminOrOperator } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'
import type { RouteContext } from '@/lib/types'

// PATCH /api/locations/[id]/status - Toggle location status (ADMIN ONLY)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAdminOrOperator()
    if (!authResult.success) {
      return authResult.error
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    if (!status || !['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
      return errorResponse('Invalid status. Must be ACTIVE, INACTIVE, or MAINTENANCE', { status: 400 })
    }

    // Use transaction to ensure atomicity
    try {
      const updatedLocation = await prisma.$transaction(async (tx) => {
        // Check if location exists
        const location = await tx.location.findUnique({
          where: { id }
        })

        if (!location) {
          throw new Error('Location not found')
        }

        // Update location status
        return await tx.location.update({
          where: { id },
          data: { status: status as LocationStatus }
        })
      })

      return successResponse(updatedLocation, {
        message: `Location status updated to ${status}`
      })
    } catch (error) {
      console.error('Update location status error:', error)
      
      // Handle transaction-specific errors
      if (error instanceof Error && error.message.includes('not found')) {
        return errorResponse('Location not found', { status: 404 })
      }
      
      return errorResponse('Internal server error')
    }
  } catch (error) {
    console.error('Update location status request error:', error)
    return errorResponse('Failed to process request')
  }
}
