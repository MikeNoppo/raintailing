"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DataTable } from "@/components/forms/data-table"
import { AdminPanel } from "@/components/admin/admin-panel"
import { Header } from "@/components/layout/header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { useAuth } from "@/lib/hooks/useAuth"
import { TAB_IDS, DASHBOARD_CONFIG } from "@/lib/constants/dashboard"

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>(DASHBOARD_CONFIG.DEFAULT_TAB)
  const [filters, setFilters] = useState({
    location: "all",
    dateRange: undefined as { from: Date; to: Date } | undefined
  })
  const searchParams = useSearchParams()
  const { isAuthenticated, logout, requireAuth } = useAuth()

  useEffect(() => {
    // Check if redirected from login with admin tab
    const tab = searchParams.get("tab")
    if (tab === TAB_IDS.ADMIN && isAuthenticated) {
      setActiveTab(TAB_IDS.ADMIN)
    }
  }, [searchParams, isAuthenticated])

  const handleAdminAccess = () => {
    requireAuth(() => setActiveTab(TAB_IDS.ADMIN))
  }

  const handleLogout = () => {
    // Immediate UI update untuk responsiveness
    setActiveTab(DASHBOARD_CONFIG.DEFAULT_TAB)
    // Then execute logout
    logout()
  }

  const handleFilterChange = (newFilters: {
    location: string;
    dateRange?: { from: Date; to: Date };
  }) => {
    setFilters({
      location: newFilters.location,
      dateRange: newFilters.dateRange
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onAdminAccess={handleAdminAccess}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-6">
        {activeTab === TAB_IDS.DASHBOARD && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <DashboardStats 
              selectedLocation={filters.location}
              useApiData={true}
            />

            {/* Charts */}
            <DashboardCharts 
              filters={filters}
              onFilterChange={handleFilterChange}
              useApiData={true}
            />
          </div>
        )}

        {activeTab === TAB_IDS.DATA && (
          <div className="space-y-6">
            <DataTable 
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {activeTab === TAB_IDS.ADMIN && (
          <div className="space-y-6">
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
