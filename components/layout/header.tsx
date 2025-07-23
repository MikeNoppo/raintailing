"use client"

import { Button } from "@/components/ui/button"
import { CloudRain, BarChart3, Settings, Menu, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onAdminAccess?: () => void
  isAuthenticated?: boolean
  onLogout?: () => void
}

export function Header({ activeTab, setActiveTab, onAdminAccess, isAuthenticated, onLogout }: HeaderProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "data", label: "Data", icon: CloudRain },
    { id: "admin", label: "Admin", icon: Settings },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <CloudRain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">RainMonitor</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => {
                    if (item.id === "admin" && onAdminAccess) {
                      onAdminAccess()
                    } else {
                      setActiveTab(item.id)
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
            
            {/* Logout Button - hanya tampil jika user sudah login */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      onClick={() => {
                        if (item.id === "admin" && onAdminAccess) {
                          onAdminAccess()
                        } else {
                          setActiveTab(item.id)
                        }
                      }}
                      className="flex items-center space-x-2 justify-start"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  )
                })}
                
                {/* Logout Button untuk mobile - hanya tampil jika user sudah login */}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    onClick={onLogout}
                    className="flex items-center space-x-2 justify-start text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
