import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult.error
    }

    return successResponse(authResult.user)

  } catch (error) {
    console.error('Get user error:', error)
    return errorResponse('Internal server error')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult.error
    }

    const { user } = authResult

    const { name, username } = await request.json()

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: user.id } },
            { username }
          ]
        }
      })

      if (existingUser) {
        return errorResponse('Username already taken', { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return successResponse(updatedUser, {
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return errorResponse('Internal server error')
  }
}
