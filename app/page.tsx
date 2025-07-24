"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DataTable } from "@/components/forms/data-table"
import { FilterControls } from "@/components/forms/filter-controls"
import { AdminPanel } from "@/components/admin/admin-panel"
import { Header } from "@/components/layout/header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { dailyData } from "@/lib/data/rainfall-data"
import { useAuth } from "@/lib/hooks/useAuth"
import { useDataFilter } from "@/lib/hooks/useDataFilter"
import { TAB_IDS, DASHBOARD_CONFIG } from "@/lib/constants/dashboard"

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>(DASHBOARD_CONFIG.DEFAULT_TAB)
  const [useApiData, setUseApiData] = useState<boolean>(true) // Enable API data by default
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
            {/* Data Source Toggle */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Mode Data:</label>
                <button
                  onClick={() => setUseApiData(!useApiData)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    useApiData 
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {useApiData ? '📊 Database' : '📋 Mock Data'}
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <DashboardStats 
              data={dailyData} 
              selectedLocation={filters.location}
            />

            {/* Charts */}
            <DashboardCharts 
              filteredData={filteredData}
              filters={filters}
              onFilterChange={handleFilterChange}
              useApiData={useApiData}
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
