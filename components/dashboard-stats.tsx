"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, Droplets, TrendingUp } from "lucide-react"
import { getRainfallStatus, calculateAverageRainfall, getCurrentRainfall } from "@/lib/utils/dashboard-utils"
import { DASHBOARD_CONFIG } from "@/lib/constants/dashboard"

interface DashboardStatsProps {
  data: Array<{ rainfall: number }>
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const currentRainfall = getCurrentRainfall(data)
  const avgRainfall = calculateAverageRainfall(data)
  const rainfallStatus = getRainfallStatus(currentRainfall)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Curah Hujan Hari Ini</CardTitle>
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
