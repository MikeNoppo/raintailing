import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

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

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission (ADMIN or OPERATOR)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'OPERATOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission (ADMIN or OPERATOR)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'OPERATOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params

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
