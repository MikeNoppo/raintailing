import { NextResponse } from "next/server"

export type ApiResponseMeta = Record<string, unknown>

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
  meta?: ApiResponseMeta
}

export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
  details?: unknown
}

interface SuccessOptions {
  status?: number
  message?: string
  meta?: ApiResponseMeta
}

interface ErrorOptions {
  status?: number
  message?: string
  details?: unknown
}

/**
 * Returns a standardized success response with optional message and meta payload.
 */
export function successResponse<T>(data: T, options: SuccessOptions = {}) {
  const { status = 200, message, meta } = options
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  }

  if (message) {
    body.message = message
  }

  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta
  }

  return NextResponse.json(body, { status })
}

/**
 * Convenience helper for 201 created responses.
 */
export function createdResponse<T>(data: T, options: Omit<SuccessOptions, "status"> = {}) {
  return successResponse(data, { ...options, status: 201 })
}

/**
 * Returns a standardized error response with optional details payload.
 */
export function errorResponse(error: string, options: ErrorOptions = {}) {
  const { status = 500, message, details } = options
  const body: ApiErrorResponse = {
    success: false,
    error,
  }

  if (message) {
    body.message = message
  }

  if (details !== undefined) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}
