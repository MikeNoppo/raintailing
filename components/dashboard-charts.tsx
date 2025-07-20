"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RainfallChart } from "@/components/rainfall-chart"
import { RainfallBarChart } from "@/components/rainfall-bar-chart"
import { RainfallClassificationChart, RainfallClassificationSummary } from "@/components/rainfall-classification-chart"
import { AreaChart } from "@/components/area-chart"
import { FilterControls } from "@/components/filter-controls"
import { dailyData } from "@/lib/data/rainfall-data"
import type { RainfallData } from "@/lib/types"

interface DashboardChartsProps {
  filteredData: RainfallData[]
  filters: {
    location: string
    dateRange?: { from: Date; to: Date }
  }
  onFilterChange: (newFilters: {
    location: string;
    dateRange?: { from: Date; to: Date };
  }) => void
}

export function DashboardCharts({ 
  filteredData, 
  filters, 
  onFilterChange 
}: DashboardChartsProps) {
  return (
    <>
      {/* Filter Controls */}
      <FilterControls onFilterChange={onFilterChange} />

      {/* Area Chart */}
      <AreaChart 
        data={filteredData} 
        filteredLocation={filters.location}
        dateRange={filters.dateRange}
      />

      {/* Charts Grid */}
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
            <CardTitle>
              {filters.location !== "all" ? 
                `Curah Hujan Harian - ${filters.location}` : 
                "Total Curah Hujan per Lokasi (Bulanan)"
              }
            </CardTitle>
            <CardDescription>
              {filters.location !== "all" ? 
                "Data harian lokasi yang dipilih" : 
                "Perbandingan antar lokasi monitoring"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filters.location !== "all" ? (
              <RainfallChart 
                data={filteredData} 
              />
            ) : (
              <RainfallBarChart 
                data={dailyData}
                type="monthly-location-total"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Classification Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RainfallClassificationChart 
          location={filters.location !== "all" ? filters.location : undefined}
          dateRange={filters.dateRange ? {
            start: filters.dateRange.from.toISOString().split('T')[0],
            end: filters.dateRange.to.toISOString().split('T')[0]
          } : undefined}
          showAsDonut={false}
          title="Klasifikasi Curah Hujan"
          description="Proporsi kategori curah hujan (Pie Chart)"
        />
        
        <RainfallClassificationSummary 
          location={filters.location !== "all" ? filters.location : undefined}
          dateRange={filters.dateRange ? {
            start: filters.dateRange.from.toISOString().split('T')[0],
            end: filters.dateRange.to.toISOString().split('T')[0]
          } : undefined}
        />
      </div>
    </>
  )
}
