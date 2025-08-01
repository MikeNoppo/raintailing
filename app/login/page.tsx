import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"
import { Suspense } from "react"

function LoginContent() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      
      {/* Right side - Full Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <Image
          src="/login.png"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginContent />
}
