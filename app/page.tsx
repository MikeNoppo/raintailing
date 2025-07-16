"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CloudRain, Droplets, TrendingUp, AlertTriangle } from "lucide-react"
import { RainfallChart } from "@/components/rainfall-chart"
import { MonthlyChart } from "@/components/monthly-chart"
import { DataTable } from "@/components/data-table"
import { FilterControls } from "@/components/filter-controls"
import { AdminPanel } from "@/components/admin-panel"
import { LocationManagement } from "@/components/location-management"
import { Header } from "@/components/header"
import { toast } from "sonner"
import { AreaChart } from "@/components/area-chart"

// Sample data
const dailyData = [
  { date: "2024-01-15", rainfall: 12.5, location: "Station A", level: "normal" },
  { date: "2024-01-16", rainfall: 25.3, location: "Station A", level: "warning" },
  { date: "2024-01-17", rainfall: 45.8, location: "Station A", level: "danger" },
  { date: "2024-01-18", rainfall: 8.2, location: "Station A", level: "normal" },
  { date: "2024-01-19", rainfall: 18.7, location: "Station A", level: "normal" },
  { date: "2024-01-20", rainfall: 32.1, location: "Station A", level: "warning" },
  { date: "2024-01-21", rainfall: 6.4, location: "Station A", level: "normal" },
]

const monthlyData = [
  { month: "Jan", rainfall: 145.2, average: 120.5 },
  { month: "Feb", rainfall: 98.7, average: 110.2 },
  { month: "Mar", rainfall: 167.3, average: 135.8 },
  { month: "Apr", rainfall: 203.1, average: 180.4 },
  { month: "May", rainfall: 89.5, average: 95.2 },
  { month: "Jun", rainfall: 234.8, average: 200.1 },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [filteredData, setFilteredData] = useState(dailyData)
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
  const totalStations = 3
  const alertCount = dailyData.filter((item) => item.level === "danger").length

  const getRainfallLevel = (rainfall: number) => {
    if (rainfall < 10) return { level: "normal", color: "bg-green-500", text: "Normal" }
    if (rainfall < 30) return { level: "warning", color: "bg-yellow-500", text: "Peringatan" }
    return { level: "danger", color: "bg-red-500", text: "Bahaya" }
  }

  const handleFilterChange = (filters: any) => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Curah Hujan Hari Ini</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentRainfall} mm</div>
                  <div className="flex items-center mt-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getRainfallLevel(currentRainfall).color}`} />
                    <p className="text-xs text-muted-foreground">{getRainfallLevel(currentRainfall).text}</p>
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peringatan</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{alertCount}</div>
                  <p className="text-xs text-muted-foreground">Alert level tinggi</p>
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
                  <CardTitle>Data Curah Hujan Bulanan</CardTitle>
                  <CardDescription>Perbandingan dengan rata-rata historis</CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthlyChart data={monthlyData} />
                </CardContent>
              </Card>
            </div>
            <AreaChart data={filteredData} />
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
