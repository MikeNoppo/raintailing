import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { createdResponse, errorResponse } from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, role } = await request.json()

    // Validate required fields
    if (!username || !password) {
      return errorResponse('Username and password are required', { status: 400 })
    }

    // Validate username format (only alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return errorResponse('Username can only contain letters, numbers, and underscores', { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters long', { status: 400 })
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return errorResponse('Username already exists', { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || username,
        role: role || 'VIEWER'
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return createdResponse(
      {
        user
      },
      { message: 'User created successfully' }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return errorResponse('Internal server error')
  }
}
