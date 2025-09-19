import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LocationStatus } from '@prisma/client'

// GET /api/locations/[id] - Get specific location (PUBLIC ACCESS)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: location
    })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}

// PATCH /api/locations/[id] - Update location (ADMIN ONLY)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can update locations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, code, description, status } = body

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // If code is being updated, check for duplicates
    if (code && code !== existingLocation.code) {
      const duplicateCode = await prisma.location.findUnique({
        where: { code: code.trim().toUpperCase() }
      })

      if (duplicateCode) {
        return NextResponse.json(
          { error: 'Location code already exists' }, 
          { status: 409 }
        )
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

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: 'Location updated successfully'
    })

  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can delete locations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if location has related data
    if (location._count.rainfallData > 0) {
      return NextResponse.json({
        error: 'Cannot delete location with existing rainfall data. Set status to INACTIVE instead.',
        details: { rainfallRecords: location._count.rainfallData }
      }, { status: 409 })
    }

    // Delete location (this will cascade to related thresholds)
    await prisma.location.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
