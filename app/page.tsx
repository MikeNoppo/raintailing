"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CloudRain, Droplets, TrendingUp, AlertTriangle } from "lucide-react"
import { RainfallChart } from "@/components/rainfall-chart"
import { MonthlyChart } from "@/components/monthly-chart"
import { RainfallBarChart } from "@/components/rainfall-bar-chart"
import { DataTable } from "@/components/data-table"
import { FilterControls } from "@/components/filter-controls"
import { AdminPanel } from "@/components/admin-panel"
import { LocationManagement } from "@/components/location-management"
import { Header } from "@/components/header"
import { toast } from "sonner"
import { AreaChart } from "@/components/area-chart"
import { RainfallClassificationChart, RainfallClassificationSummary } from "@/components/rainfall-classification-chart"
import { RainfallAnalyticsDashboard } from "@/components/rainfall-analytics-dashboard"
import { dailyData, monthlyData } from "@/lib/data/rainfall-data"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [filteredData, setFilteredData] = useState(dailyData)
  const [currentFilters, setCurrentFilters] = useState<{
    location: string
    dateRange?: { from: Date; to: Date }
  }>({ location: "all" })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem("isAuthenticated") === "true"
    setIsAuthenticated(authStatus)
    
    // Check if redirected from login with admin tab
    const tab = searchParams.get("tab")
    if (tab === "admin" && authStatus) {
      setActiveTab("admin")
    }
  }, [searchParams])

  const handleAdminAccess = () => {
    if (!isAuthenticated) {
      router.push("/login?return=admin")
    } else {
      setActiveTab("admin")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    setIsAuthenticated(false)
    setActiveTab("dashboard")
    toast.success("Logout berhasil!")
  }

  const currentRainfall = dailyData[dailyData.length - 1]?.rainfall || 0
  const avgRainfall = dailyData.reduce((sum, item) => sum + item.rainfall, 0) / dailyData.length
  const totalStations = 6

  const getRainfallStatus = (rainfall: number) => {
    if (rainfall < 10) return { color: "bg-green-500", text: "Normal" }
    if (rainfall < 30) return { color: "bg-yellow-500", text: "Sedang" }
    return { color: "bg-red-500", text: "Tinggi" }
  }

  const handleFilterChange = (filters: any) => {
    // Store current filters
    setCurrentFilters({
      location: filters.location || "all",
      dateRange: filters.dateRange
    })
    
    // Apply filters to data
    let filtered = dailyData
    if (filters.location && filters.location !== "all") {
      filtered = filtered.filter((item) => item.location === filters.location)
    }
    if (filters.dateRange) {
      // Apply date range filter
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= filters.dateRange.from && itemDate <= filters.dateRange.to
      })
    }
    setFilteredData(filtered)
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
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Curah Hujan Hari Ini</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentRainfall} mm</div>
                  <div className="flex items-center mt-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getRainfallStatus(currentRainfall).color}`} />
                    <p className="text-xs text-muted-foreground">{getRainfallStatus(currentRainfall).text}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rata-rata Mingguan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgRainfall.toFixed(1)} mm</div>
                  <p className="text-xs text-muted-foreground">+12% dari minggu lalu</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stasiun Aktif</CardTitle>
                  <CloudRain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStations}</div>
                  <p className="text-xs text-muted-foreground">Semua stasiun online</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Controls */}
            <FilterControls onFilterChange={handleFilterChange} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Curah Hujan Harian</CardTitle>
                  <CardDescription>Grafik curah hujan 7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <RainfallChart data={filteredData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Curah Hujan per Lokasi</CardTitle>
                  <CardDescription>Perbandingan total curah hujan antar lokasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <RainfallBarChart 
                    data={filteredData} 
                    type="location-total"
                    orientation="vertical"
                    showComparison={false}
                    dateRange={currentFilters.dateRange ? {
                      start: currentFilters.dateRange.from.toISOString().split('T')[0],
                      end: currentFilters.dateRange.to.toISOString().split('T')[0]
                    } : undefined}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Rainfall Classification Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RainfallClassificationChart 
                location={currentFilters.location !== "all" ? currentFilters.location : undefined}
                dateRange={currentFilters.dateRange ? {
                  start: currentFilters.dateRange.from.toISOString().split('T')[0],
                  end: currentFilters.dateRange.to.toISOString().split('T')[0]
                } : undefined}
                showAsDonut={true}
                title="Klasifikasi Curah Hujan"
                description="Proporsi kategori curah hujan (Pie Chart)"
              />
              
              <RainfallClassificationSummary 
                location={currentFilters.location !== "all" ? currentFilters.location : undefined}
                dateRange={currentFilters.dateRange ? {
                  start: currentFilters.dateRange.from.toISOString().split('T')[0],
                  end: currentFilters.dateRange.to.toISOString().split('T')[0]
                } : undefined}
              />
            </div>

            <AreaChart 
              data={filteredData} 
              filteredLocation={currentFilters.location}
              dateRange={currentFilters.dateRange}
            />
          </div>
        )}

        {activeTab === "classification" && (
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
              selectedLocation={currentFilters.location !== "all" ? currentFilters.location : undefined}
              dateRange={currentFilters.dateRange ? {
                start: currentFilters.dateRange.from.toISOString().split('T')[0],
                end: currentFilters.dateRange.to.toISOString().split('T')[0]
              } : undefined}
            />
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Data Curah Hujan</h2>
              <Button>Export ke Excel</Button>
            </div>
            <FilterControls onFilterChange={handleFilterChange} />
            <DataTable data={filteredData} />
          </div>
        )}

        {activeTab === "locations" && (
          <div className="space-y-6">
            <LocationManagement />
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Panel Admin</h2>
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  )
}
