import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { LocationStatus } from '@prisma/client'

import { successResponse, errorResponse } from '@/lib/api/responses'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/locations/[id]/status - Toggle location status (ADMIN ONLY)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return errorResponse('Unauthorized', { status: 401 })
    }

    // Only ADMIN can change location status
    if (session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden - Admin access required', { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    if (!status || !['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
      return errorResponse('Invalid status. Must be ACTIVE, INACTIVE, or MAINTENANCE', { status: 400 })
    }

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id }
    })

    if (!location) {
      return errorResponse('Location not found', { status: 404 })
    }

    // Update location status
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { status: status as LocationStatus }
    })

    return successResponse(updatedLocation, {
      message: `Location status updated to ${status}`
    })

  } catch (error) {
    console.error('Error updating location status:', error)
    return errorResponse('Internal Server Error')
  }
}
