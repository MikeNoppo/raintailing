"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, Droplets, TrendingUp, Loader2 } from "lucide-react"
import { getRainfallStatus, calculateAverageRainfall, getCurrentRainfall } from "@/lib/utils/dashboard-utils"
import { DASHBOARD_CONFIG } from "@/lib/constants/dashboard"
import { useRainfallData } from "@/lib/hooks"
import { useLocations } from "@/lib/hooks/useLocations"
import type { RainfallData } from "@/lib/types"

interface DashboardStatsProps {
  data?: RainfallData[]
  selectedLocation?: string
  useApiData?: boolean
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

export function DashboardStats({ data: propData, selectedLocation, useApiData = false }: DashboardStatsProps) {
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Fetch data from API if useApiData is true
  const { 
    data: apiData, 
    error: apiError, 
    isLoading: apiLoading 
  } = useRainfallData(
    useApiData ? {
      location: selectedLocation !== "all" ? selectedLocation : undefined,
      limit: 100, // Get recent data for stats
      sortBy: 'date',
      order: 'desc'
    } : undefined
  )

  // Fetch locations data for active stations count
  const { 
    locations: apiLocations, 
    loading: locationsLoading 
  } = useLocations({ 
    status: 'ACTIVE', 
    autoRefresh: true, 
    refreshInterval: 60000 
  })

  // Use API data if available, otherwise fallback to prop data
  const data = useApiData && apiData?.data 
    ? apiData.data.map(item => ({
        date: item.date,
        rainfall: item.rainfall,
        location: item.location.code
      }))
    : propData || []

  // Calculate active stations count from API or fallback to default
  const activeStationsCount = useApiData && apiLocations 
    ? apiLocations.filter(loc => loc.status === 'ACTIVE').length
    : DASHBOARD_CONFIG.TOTAL_STATIONS

  // Auto-rotate locations setiap 3 detik ketika tidak ada lokasi yang dipilih
  useEffect(() => {
    if (!selectedLocation || selectedLocation === "all") {
      const interval = setInterval(() => {
        setIsAnimating(true)
        
        // Delay untuk animasi fade-out
        setTimeout(() => {
          setCurrentLocationIndex((prev) => (prev + 1) % LOCATIONS.length)
          setIsAnimating(false)
        }, 200) // 200ms fade-out duration
        
      }, 3000) // 3 detik
      
      return () => clearInterval(interval)
    }
  }, [selectedLocation])

  // Loading state for API data
  if (useApiData && (apiLoading || locationsLoading)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <Loader2 className="h-4 w-4 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Loading data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state for API data
  if (useApiData && apiError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
              <CloudRain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Failed to load data</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
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
      <Card className={`transition-all duration-300 ${
        isAnimating ? 'ring-2 ring-blue-200 shadow-lg' : ''
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Curah Hujan Hari Ini
            {(!selectedLocation || selectedLocation === "all") && (
              <span 
                className={`text-xs font-normal text-muted-foreground block transition-all duration-300 ${
                  isAnimating ? 'opacity-0 transform translate-y-1' : 'opacity-100 transform translate-y-0'
                }`}
              >
                {getLocationName(displayLocation)}
              </span>
            )}
          </CardTitle>
          <Droplets className={`h-4 w-4 text-muted-foreground transition-all duration-300 ${
            isAnimating ? 'transform rotate-12 scale-110' : 'transform rotate-0 scale-100'
          }`} />
        </CardHeader>
        <CardContent>
          <div 
            className={`text-2xl font-bold transition-all duration-300 delay-75 ${
              isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
            }`}
          >
            {currentRainfall} mm
          </div>
          <div 
            className={`flex items-center mt-2 transition-all duration-300 delay-100 ${
              isAnimating ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 transition-all duration-300 ${rainfallStatus.color} ${
              isAnimating ? 'scale-75' : 'scale-100'
            }`} />
            <p className="text-xs text-muted-foreground">{rainfallStatus.text}</p>
          </div>
        </CardContent>
      </Card>

      <Card className={`transition-all duration-300 ${
        isAnimating ? 'ring-2 ring-blue-200 shadow-lg' : ''
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rata-rata Mingguan
            {(!selectedLocation || selectedLocation === "all") && (
              <span 
                className={`text-xs font-normal text-muted-foreground block transition-all duration-300 ${
                  isAnimating ? 'opacity-0 transform translate-y-1' : 'opacity-100 transform translate-y-0'
                }`}
              >
                {getLocationName(displayLocation)}
              </span>
            )}
          </CardTitle>
          <TrendingUp className={`h-4 w-4 text-muted-foreground transition-all duration-300 ${
            isAnimating ? 'transform rotate-12 scale-110' : 'transform rotate-0 scale-100'
          }`} />
        </CardHeader>
        <CardContent>
          <div 
            className={`text-2xl font-bold transition-all duration-300 delay-100 ${
              isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
            }`}
          >
            {avgRainfall.toFixed(1)} mm
          </div>
          <p 
            className={`text-xs text-muted-foreground transition-all duration-300 delay-125 ${
              isAnimating ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
            }`}
          >
            {weeklyChange}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {useApiData ? 'Lokasi Aktif' : 'Lokasi Aktif'}
          </CardTitle>
          <CloudRain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {useApiData && locationsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin inline" />
            ) : (
              activeStationsCount
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {useApiData 
              ? (locationsLoading 
                  ? "Loading..." 
                  : activeStationsCount === 1 
                    ? "Stasiun online" 
                    : "Stasiun online"
                )
              : "Semua stasiun online"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
