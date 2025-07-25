"use client"

import { SessionProvider } from "next-auth/react"
import { SWRProvider } from "@/lib/swr-config"

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SWRProvider>
      <SessionProvider 
        refetchInterval={5 * 60} // Refetch session every 5 minutes instead of default
        refetchOnWindowFocus={false} // Disable refetch on window focus to reduce delays
      >
        {children}
      </SessionProvider>
    </SWRProvider>
  )
}
