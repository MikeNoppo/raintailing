import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { UserRole } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse } from './responses'

/**
 * Authenticated user with database validation
 */
export interface AuthenticatedUser {
  id: string
  email: string | null
  name: string | null
  role: UserRole
}

/**
 * Result of authentication check
 */
export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: NextResponse }

/**
 * Check if user is authenticated and exists in database
 * @returns AuthResult with user data or error response
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      error: errorResponse('Unauthorized - Authentication required', { status: 401 })
    }
  }

  // Validate user exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (!user) {
    return {
      success: false,
      error: errorResponse('User not found in database', { status: 401 })
    }
  }

  return {
    success: true,
    user
  }
}

/**
 * Check if user is authenticated and has specific role(s)
 * @param allowedRoles - Array of roles that are allowed
 * @returns AuthResult with user data or error response
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthResult> {
  const authResult = await requireAuth()

  if (!authResult.success) {
    return authResult
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      success: false,
      error: errorResponse(
        `Forbidden - ${allowedRoles.join(' or ')} access required`,
        { status: 403 }
      )
    }
  }

  return authResult
}

/**
 * Check if user is authenticated and is ADMIN
 * @returns AuthResult with user data or error response
 */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole('ADMIN')
}

/**
 * Check if user is authenticated and is ADMIN or OPERATOR
 * @returns AuthResult with user data or error response
 */
export async function requireAdminOrOperator(): Promise<AuthResult> {
  return requireRole('ADMIN', 'OPERATOR')
}

/**
 * Get current session (optional - returns null if not authenticated)
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export async function getOptionalAuth(): Promise<Session | null> {
  return getServerSession(authOptions)
}
