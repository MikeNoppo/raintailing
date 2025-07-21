"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, Droplets, TrendingUp } from "lucide-react"
import { getRainfallStatus, calculateAverageRainfall, getCurrentRainfall } from "@/lib/utils/dashboard-utils"
import { DASHBOARD_CONFIG } from "@/lib/constants/dashboard"
import type { RainfallData } from "@/lib/types"

interface DashboardStatsProps {
  data: RainfallData[]
  selectedLocation?: string
}

// Lokasi untuk rotation
const LOCATIONS = ["GSW-PIT", "GSW-DP3", "TSF", "KNC-PRT", "TGR-PRT", "GSW-NTH"]

// Mapping nama lokasi
const getLocationName = (code: string) => {
  const locationMap: { [key: string]: string } = {
    "GSW-PIT": "Gosowong Pit",
    "GSW-DP3": "Gosowong DP3", 
    "TSF": "Tailing Dam",
    "KNC-PRT": "Kencana Portal",
    "TGR-PRT": "Toguraci Portal",
    "GSW-NTH": "Gosowong North"
  }
  return locationMap[code] || code
}

// Hitung perubahan mingguan (simulasi berdasarkan data)
const calculateWeeklyChange = (data: RainfallData[]) => {
  if (data.length < 7) return "+0% dari minggu lalu"
  
  // Ambil data 7 hari terakhir dan 7 hari sebelumnya
  const sortedData = data.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
  const recentWeek = sortedData.slice(-7).reduce((sum, item) => sum + item.rainfall, 0)
  const previousWeek = sortedData.slice(-14, -7).reduce((sum, item) => sum + item.rainfall, 0)
  
  if (previousWeek === 0) return "+0% dari minggu lalu"
  
  const change = ((recentWeek - previousWeek) / previousWeek) * 100
  const sign = change >= 0 ? "+" : ""
  return `${sign}${change.toFixed(0)}% dari minggu lalu`
}

export function DashboardStats({ data, selectedLocation }: DashboardStatsProps) {
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  
  // Auto-rotate locations setiap 3 detik ketika tidak ada lokasi yang dipilih
  useEffect(() => {
    if (!selectedLocation || selectedLocation === "all") {
      const interval = setInterval(() => {
        setCurrentLocationIndex((prev) => (prev + 1) % LOCATIONS.length)
      }, 3000) // 3 detik
      
      return () => clearInterval(interval)
    }
  }, [selectedLocation])
  
  // Tentukan lokasi yang akan ditampilkan
  const displayLocation = selectedLocation && selectedLocation !== "all" 
    ? selectedLocation 
    : LOCATIONS[currentLocationIndex]
  
  // Filter data berdasarkan lokasi yang ditampilkan
  const locationData = data.filter(item => item.location === displayLocation)
  
  // Hitung stats berdasarkan data lokasi
  const currentRainfall = getCurrentRainfall(locationData)
  const avgRainfall = calculateAverageRainfall(locationData)
  const rainfallStatus = getRainfallStatus(currentRainfall)
  
  // Hitung persentase perubahan (simulasi)
  const weeklyChange = calculateWeeklyChange(locationData)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Curah Hujan Hari Ini
            {(!selectedLocation || selectedLocation === "all") && (
              <span className="text-xs font-normal text-muted-foreground block">
                {getLocationName(displayLocation)}
              </span>
            )}
          </CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentRainfall} mm</div>
          <div className="flex items-center mt-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${rainfallStatus.color}`} />
            <p className="text-xs text-muted-foreground">{rainfallStatus.text}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rata-rata Mingguan
            {(!selectedLocation || selectedLocation === "all") && (
              <span className="text-xs font-normal text-muted-foreground block">
                {getLocationName(displayLocation)}
              </span>
            )}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgRainfall.toFixed(1)} mm</div>
          <p className="text-xs text-muted-foreground">{weeklyChange}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lokasi Aktif</CardTitle>
          <CloudRain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{DASHBOARD_CONFIG.TOTAL_STATIONS}</div>
          <p className="text-xs text-muted-foreground">Semua stasiun online</p>
        </CardContent>
      </Card>
    </div>
  )
}
