import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/rainfall/[id] - Get specific rainfall data (PUBLIC ACCESS)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Make GET public - no authentication required
    const { id } = await params

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
      return NextResponse.json(
        { error: 'Rainfall data not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: rainfallData })

  } catch (error) {
    console.error('Get rainfall data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/rainfall/[id] - Update rainfall data (ADMIN ONLY)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can update rainfall data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { date, rainfall, locationId, notes } = await request.json()

    // Check if rainfall data exists
    const existingData = await prisma.rainfallData.findUnique({
      where: { id }
    })

    if (!existingData) {
      return NextResponse.json(
        { error: 'Rainfall data not found' },
        { status: 404 }
      )
    }

    // Validate rainfall value if provided
    if (rainfall !== undefined && rainfall < 0) {
      return NextResponse.json(
        { error: 'Rainfall value must be >= 0' },
        { status: 400 }
      )
    }

    // Validate location exists and is active if location is being changed
    if (locationId && locationId !== existingData.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        )
      }

      if (location.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Location is not active' },
          { status: 400 }
        )
      }

      // Check for duplicate entry if date or location is changing
      if (date || locationId) {
        const checkDate = date ? new Date(date) : existingData.date
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
          return NextResponse.json(
            { error: 'Rainfall data for this date and location already exists' },
            { status: 409 }
          )
        }
      }
    }

    // Update rainfall data
    const updatedData = await prisma.rainfallData.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
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

    return NextResponse.json({
      message: 'Rainfall data updated successfully',
      data: updatedData
    })

  } catch (error) {
    console.error('Update rainfall data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/rainfall/[id] - Delete rainfall data (ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can delete rainfall data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if rainfall data exists
    const existingData = await prisma.rainfallData.findUnique({
      where: { id }
    })

    if (!existingData) {
      return NextResponse.json(
        { error: 'Rainfall data not found' },
        { status: 404 }
      )
    }

    // Delete rainfall data
    await prisma.rainfallData.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Rainfall data deleted successfully'
    })

  } catch (error) {
    console.error('Delete rainfall data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
