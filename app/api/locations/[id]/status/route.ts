import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LocationStatus } from '@prisma/client'

// PATCH /api/locations/[id]/status - Toggle location status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    if (!status || !['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, INACTIVE, or MAINTENANCE' }, 
        { status: 400 }
      )
    }

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Update location status
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { status: status as LocationStatus }
    })

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: `Location status updated to ${status}`
    })

  } catch (error) {
    console.error('Error updating location status:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
