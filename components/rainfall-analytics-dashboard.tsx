"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Droplets, Calendar, MapPin } from "lucide-react"
import { 
  getRainfallStatsByLocation, 
  getOverallRainfallStats, 
  getDominantCategory,
  formatPercentage,
  rainfallCategories,
  type RainfallCategory 
} from "@/lib/data/rainfall-analytics"
import { dailyData, type RainfallData } from "@/lib/data/rainfall-data"
import { RainfallClassificationChart } from "./rainfall-classification-chart"

interface RainfallAnalyticsDashboardProps {
  data?: RainfallData[]
  selectedLocation?: string
  dateRange?: {
    start: string
    end: string
  }
}

export function RainfallAnalyticsDashboard({ 
  data = dailyData, 
  selectedLocation,
  dateRange 
}: RainfallAnalyticsDashboardProps) {
  const filteredData = React.useMemo(() => {
    let result = data

    // Filter by date range
    if (dateRange) {
      result = result.filter(item => 
        item.date >= dateRange.start && item.date <= dateRange.end
      )
    }

    // Filter by location
    if (selectedLocation && selectedLocation !== "all") {
      result = result.filter(item => item.location === selectedLocation)
    }

    return result
  }, [data, selectedLocation, dateRange])

  const overallStats = React.useMemo(() => 
    getOverallRainfallStats(filteredData), [filteredData]
  )

  const locationStats = React.useMemo(() => 
    getRainfallStatsByLocation(filteredData), [filteredData]
  )

  const dominantCategory = React.useMemo(() => 
    getDominantCategory(overallStats.categories), [overallStats.categories]
  )

  const getCategoryIcon = (category: RainfallCategory) => {
    return rainfallCategories[category].emoji
  }

  const getCategoryColor = (category: RainfallCategory) => {
    switch (category) {
      case "tidakHujan": return "bg-gray-100 text-gray-800"
      case "ringan": return "bg-green-100 text-green-800"
      case "sedang": return "bg-yellow-100 text-yellow-800"
      case "lebat": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hari</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalDays}</div>
            <p className="text-xs text-muted-foreground">
              {selectedLocation ? `Lokasi: ${selectedLocation}` : "Semua lokasi"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Dominan</CardTitle>
            <span className="text-lg">{getCategoryIcon(dominantCategory.category)}</span>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {rainfallCategories[dominantCategory.category].label}
            </div>
            <p className="text-xs text-muted-foreground">
              {dominantCategory.count} hari ({dominantCategory.percentage.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Harian</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgRainfall.toFixed(1)} mm</div>
            <p className="text-xs text-muted-foreground">
              Max: {overallStats.maxRainfall} mm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Curah Hujan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalRainfall.toFixed(1)} mm</div>
            <p className="text-xs text-muted-foreground">
              Median: {overallStats.percentiles.p50} mm
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Kategori Curah Hujan</CardTitle>
          <CardDescription>
            Jumlah hari untuk setiap kategori curah hujan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(overallStats.categories).map(([category, count]) => {
              const categoryInfo = rainfallCategories[category as RainfallCategory]
              const percentage = formatPercentage(count, overallStats.totalDays)
              
              return (
                <div key={category} className="text-center space-y-2">
                  <div className="text-3xl">{categoryInfo.emoji}</div>
                  <div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{percentage}</div>
                  </div>
                  <Badge className={getCategoryColor(category as RainfallCategory)}>
                    {categoryInfo.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RainfallClassificationChart 
          location={selectedLocation}
          dateRange={dateRange}
          showAsDonut={true}
          title="Distribusi Proporsi (Donut)"
          description="Persentase setiap kategori curah hujan"
        />
        
        <RainfallClassificationChart 
          location={selectedLocation}
          dateRange={dateRange}
          showAsDonut={false}
          title="Distribusi Proporsi (Pie)"
          description="Persentase setiap kategori curah hujan"
        />
      </div>

      {/* Location Comparison (only show if no specific location selected) */}
      {(!selectedLocation || selectedLocation === "all") && locationStats.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Antar Lokasi</CardTitle>
            <CardDescription>
              Statistik kategori curah hujan untuk setiap lokasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationStats.map((stats) => {
                const locationDominant = getDominantCategory(stats.categories)
                
                return (
                  <div key={stats.location} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stats.location}</span>
                        <Badge variant="outline">
                          {stats.totalDays} hari
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(locationDominant.category)}</span>
                        <span className="text-sm font-medium">
                          {rainfallCategories[locationDominant.category].label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {Object.entries(stats.categories).map(([category, count]) => {
                        const categoryInfo = rainfallCategories[category as RainfallCategory]
                        const percentage = formatPercentage(count, stats.totalDays)
                        
                        return (
                          <div key={category} className="space-y-1">
                            <div className="text-sm">{categoryInfo.emoji}</div>
                            <div className="text-lg font-bold">{count}</div>
                            <div className="text-xs text-muted-foreground">{percentage}</div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rata-rata: </span>
                        <span className="font-medium">{stats.avgRainfall.toFixed(1)} mm</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Maksimum: </span>
                        <span className="font-medium">{stats.maxRainfall} mm</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">{stats.totalRainfall.toFixed(1)} mm</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
