"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { FilterControls } from "@/components/filter-controls"
import { AdminPanel } from "@/components/admin-panel"
import { Header } from "@/components/header"
import { RainfallAnalyticsDashboard } from "@/components/rainfall-analytics-dashboard"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard-charts"
import { dailyData } from "@/lib/data/rainfall-data"
import { useAuth } from "@/lib/hooks/useAuth"
import { useDataFilter } from "@/lib/hooks/useDataFilter"
import { TAB_IDS, DASHBOARD_CONFIG } from "@/lib/constants/dashboard"

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>(DASHBOARD_CONFIG.DEFAULT_TAB)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, logout, requireAuth } = useAuth()
  const { filters, filteredData, updateFilters } = useDataFilter(dailyData)

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
    logout()
    setActiveTab(DASHBOARD_CONFIG.DEFAULT_TAB)
  }

  const handleFilterChange = (newFilters: {
    location: string;
    dateRange?: { from: Date; to: Date };
  }) => {
    updateFilters(newFilters)
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
            <DashboardStats data={dailyData} />

            {/* Charts */}
            <DashboardCharts 
              filteredData={filteredData}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {activeTab === TAB_IDS.CLASSIFICATION && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Klasifikasi Curah Hujan</h2>
                <p className="text-muted-foreground">
                  Analisis proporsi kategori curah hujan berdasarkan standar meteorologi Indonesia
                </p>
              </div>
            </div>
            
            <FilterControls onFilterChange={handleFilterChange} />
            
            <RainfallAnalyticsDashboard 
              data={dailyData}
              selectedLocation={filters.location !== "all" ? filters.location : undefined}
              dateRange={filters.dateRange ? {
                start: filters.dateRange.from.toISOString().split('T')[0],
                end: filters.dateRange.to.toISOString().split('T')[0]
              } : undefined}
            />
          </div>
        )}

        {activeTab === TAB_IDS.DATA && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Data Curah Hujan</h2>
            </div>
            <FilterControls onFilterChange={handleFilterChange} />
            <DataTable data={filteredData} />
          </div>
        )}

        {activeTab === TAB_IDS.ADMIN && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Panel Admin</h2>
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
