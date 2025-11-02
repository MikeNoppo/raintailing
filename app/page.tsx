"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DataTable } from "@/components/forms/data-table"
import { AdminPanel } from "@/components/admin/admin-panel"
import { Header } from "@/components/layout/header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { useAuth } from "@/lib/hooks/useAuth"
import { useAvailableDates } from "@/lib/hooks/useAvailableDates"
import { TAB_IDS, DASHBOARD_CONFIG } from "@/lib/constants/dashboard"

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>(DASHBOARD_CONFIG.DEFAULT_TAB)
  const [filters, setFilters] = useState({
    location: "all",
    dateRange: undefined as { from: Date; to: Date } | undefined
  })
  const [hasManuallyCleared, setHasManuallyCleared] = useState(false)
  const searchParams = useSearchParams()
  const { isAuthenticated, logout, requireAuth } = useAuth()
  const { latestMonth } = useAvailableDates({
    location: filters.location !== "all" ? filters.location : undefined
  })

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === TAB_IDS.ADMIN && isAuthenticated) {
      setActiveTab(TAB_IDS.ADMIN)
    }
  }, [searchParams, isAuthenticated])

  useEffect(() => {
    if (latestMonth && !filters.dateRange && !hasManuallyCleared) {
      const [year, month] = latestMonth.split('-').map(Number)
      const startDate = new Date(Date.UTC(year, month - 1, 1))
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
      const endDate = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999))
      
      setFilters(prev => ({
        ...prev,
        dateRange: { from: startDate, to: endDate }
      }))
    }
  }, [latestMonth, filters.dateRange, hasManuallyCleared])

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
    // Track if user manually cleared the date range
    if (!newFilters.dateRange && filters.dateRange) {
      setHasManuallyCleared(true)
    } else if (newFilters.dateRange) {
      setHasManuallyCleared(false)
    }
    
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
