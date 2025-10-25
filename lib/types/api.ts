/**
 * Standard route parameter types for Next.js 15 App Router
 * All params are Promises and must be awaited
 */

/**
 * Route context with a single ID parameter
 * Usage: export async function GET(request: NextRequest, context: RouteContext)
 */
export interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * Route context with custom parameter keys
 * Usage: export async function GET(request: NextRequest, context: RouteContextWithParams<{ slug: string }>)
 */
export interface RouteContextWithParams<T extends Record<string, string>> {
  params: Promise<T>
}

/**
 * Helper type for extracting awaited params type
 * Usage: type Params = Awaited<RouteContext['params']>
 */
export type AwaitedParams<T> = T extends Promise<infer U> ? U : T
