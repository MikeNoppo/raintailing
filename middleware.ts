import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without authentication
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true
        }
        
        // Allow access to API auth routes
        if (req.nextUrl.pathname.startsWith('/api/auth')) {
          return true
        }
        
        // For admin routes, check if user has ADMIN or OPERATOR role
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'OPERATOR'
        }
        
        // For other protected routes, just check if authenticated
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Protect admin routes
    '/admin/:path*',
    // Add other protected routes here if needed
  ]
}
