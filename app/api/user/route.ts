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

    // Use transaction to ensure data consistency during update
    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        // Check if username is already taken by another user
        if (username) {
          const existingUser = await tx.user.findFirst({
            where: {
              AND: [
                { id: { not: user.id } },
                { username }
              ]
            }
          })

          if (existingUser) {
            throw new Error('Username already taken')
          }
        }

        return await tx.user.update({
          where: { id: user.id },
          data: {
            ...(name !== undefined && { name }),
            ...(username !== undefined && { username }),
          },
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        })
      })

      return successResponse(updatedUser, {
        message: 'Profile updated successfully'
      })
    } catch (error) {
      console.error('Update user error:', error)

      // Handle transaction-specific errors
      if (error instanceof Error) {
        if (error.message.includes('already taken')) {
          return errorResponse(error.message, { status: 400 })
        }
      }

      return errorResponse('Internal server error')
    }

  } catch (error) {
    console.error('Update user request error:', error)
    return errorResponse('Internal server error')
  }
}
