"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RainfallChart } from "@/components/charts/rainfall-chart"
import { RainfallBarChart } from "@/components/charts/rainfall-bar-chart"
import { RainfallClassificationChart, RainfallClassificationSummary } from "@/components/charts/rainfall-classification-chart"
import { AreaChart } from "@/components/charts/area-chart"
import { FilterControls } from "@/components/forms/filter-controls"
import { format } from "date-fns"

interface DashboardChartsProps {
  filters: {
    location: string
    dateRange?: { from: Date; to: Date }
  }
  onFilterChange: (newFilters: {
    location: string;
    dateRange?: { from: Date; to: Date };
  }) => void
  useApiData?: boolean
}

export function DashboardCharts({ 
  filters, 
  onFilterChange,
  useApiData = false
}: DashboardChartsProps) {
  const dateRange = filters.dateRange ? {
    start: format(filters.dateRange.from, 'yyyy-MM-dd'),
    end: format(filters.dateRange.to, 'yyyy-MM-dd')
  } : undefined

  return (
    <>
      {/* Filter Controls */}
      <FilterControls filters={filters} onFilterChange={onFilterChange} />

      {/* Area Chart */}
      <AreaChart 
        filteredLocation={filters.location}
        dateRange={filters.dateRange}
        useApiData={useApiData}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Curah Hujan Harian</CardTitle>
            <CardDescription>
              {useApiData ? "Data real-time dari database" : "Grafik curah hujan 7 hari terakhir"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {useApiData ? (
              <RainfallChart 
                selectedLocation={filters.location !== "all" ? filters.location : undefined}
                dateRange={dateRange}
                useApiData={true}
              />
            ) : (
              <RainfallChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {filters.location !== "all" ? 
                `Curah Hujan Harian - ${filters.location}` : 
                "Total Curah Hujan per Lokasi"
              }
            </CardTitle>
            <CardDescription>
              {useApiData 
                ? (filters.location !== "all" 
                    ? "Data harian lokasi yang dipilih dari database" 
                    : "Perbandingan antar lokasi dari database")
                : "Data historis lokasi monitoring"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {useApiData ? (
              <RainfallBarChart 
                selectedLocation={filters.location !== "all" ? filters.location : undefined}
                dateRange={dateRange}
                useApiData={true}
                type={filters.location !== "all" ? "daily" : "location-total"}
              />
            ) : (
              <RainfallBarChart 
                type="monthly-location-total"
                selectedLocation={filters.location !== "all" ? filters.location : undefined}
                dateRange={dateRange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Classification Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RainfallClassificationChart 
          location={filters.location !== "all" ? filters.location : undefined}
          dateRange={dateRange}
          showAsDonut={false}
          title="Klasifikasi Curah Hujan"
          description={useApiData ? "Proporsi kategori dari database" : "Proporsi kategori curah hujan (Pie Chart)"}
          useApiData={useApiData}
        />
        
        <RainfallClassificationSummary 
          location={filters.location !== "all" ? filters.location : undefined}
          dateRange={dateRange}
          useApiData={useApiData}
        />
      </div>
    </>
  )
}
