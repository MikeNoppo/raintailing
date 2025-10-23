"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { Loader2 } from "lucide-react"
import { useRainfallData } from "@/lib/hooks"
import { 
  transformRainfallDataForCharts
} from "@/lib/utils/data-transformers"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface AggregatedDataItem {
  date?: string;
  month?: string;
  rainfall: number;
  location?: string;
}

interface RainfallBarChartProps {
  data?: Array<{
    date?: string
    month?: string
    rainfall: number
    location?: string
  }>
  type?: "daily" | "monthly" | "location-total" | "monthly-location-total"
  orientation?: "vertical" | "horizontal"
  showComparison?: boolean
  comparisonData?: Array<{
    date?: string
    month?: string
    value: number
    label: string
  }>
  dateRange?: {
    start?: string
    end?: string
  }
  selectedLocation?: string
  useApiData?: boolean
  height?: string
}

export function RainfallBarChart({ 
  data = [], 
  type = "daily",
  orientation = "vertical",
  showComparison = false,
  comparisonData,
  dateRange,
  selectedLocation,
  useApiData = false,
  height = "h-80"
}: RainfallBarChartProps) {
  
  // Fetch data from API if useApiData is true
  const { 
    data: apiData, 
    error: apiError, 
    isLoading: apiLoading 
  } = useRainfallData(
    useApiData ? {
      location: type === "location-total" ? undefined : selectedLocation,
  startDate: dateRange?.start,
  endDate: dateRange?.end,
      sortBy: 'date',
      order: 'asc',
      limit: 1000
    } : {}
  )

  // Determine data source
  const dataSource = useApiData && apiData?.data?.records 
    ? transformRainfallDataForCharts(apiData.data.records)
    : data

  // Show loading state
  if (useApiData && apiLoading) {
    return (
      <div className={`${height} flex items-center justify-center`}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading chart data...</span>
      </div>
    )
  }

  // Show error state
  if (useApiData && apiError) {
    return (
      <div className={`${height} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load chart data</div>
          <div className="text-sm text-muted-foreground">{apiError.message}</div>
        </div>
      </div>
    )
  }
  
  // Aggregate data by location when type is "location-total"
  const getAggregatedData = () => {
    // If a specific location is selected and we're in monthly-location-total mode,
    // show daily data for that location instead of aggregated totals
    if (type === "monthly-location-total" && selectedLocation && selectedLocation !== "all") {
      
      // Filter data for the selected location and group by day
      // Handle both location codes (GSW-PIT) and full names (Gosowong Pit)
      const locationData = dataSource.filter(item => {
        if (!item.location) return false
        
        // Direct match first (exact match)
        if (item.location === selectedLocation) {
          return true
        }
        
        // Check case-insensitive match
        if (item.location.toLowerCase() === selectedLocation.toLowerCase()) {
          return true
        }
        
        return false
      })
      
      // If we have a date range, filter by it, otherwise use current month
      let filteredData = locationData
      if (dateRange?.start) {
        const startDate = new Date(dateRange.start)
        const endDate = dateRange.end ? new Date(dateRange.end) : new Date(dateRange.start)
        filteredData = locationData.filter(item => {
          if (item.date) {
            const itemDate = new Date(item.date)
            return itemDate >= startDate && itemDate <= endDate
          }
          return false
        })
      } else {
        // Default to June 2025 since that's where our data is
        filteredData = locationData.filter(item => {
          if (item.date) {
            const itemDate = new Date(item.date)
            // Check for June 2025 (month 5, 0-indexed)
            const isJune2025 = itemDate.getMonth() === 5 && itemDate.getFullYear() === 2025
            return isJune2025
          }
          return false
        })
      }
      
      return filteredData.sort((a, b) => {
        if (a.date && b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        }
        return 0
      })
    }
    
    if (type === "location-total") {
      const locationTotals: { [key: string]: number } = {}
      
      dataSource.forEach(item => {
        if (item.location) {
          if (!locationTotals[item.location]) {
            locationTotals[item.location] = 0
          }
          locationTotals[item.location] += item.rainfall
        }
      })
      
      return Object.entries(locationTotals).map(([location, total]) => ({
        location,
        rainfall: total
      }))
    }
    
    if (type === "monthly-location-total") {
      const monthlyLocationTotals: { [key: string]: { [key: string]: number } } = {}
      
      dataSource.forEach(item => {
        if (item.location && item.date) {
          const date = new Date(item.date)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyLocationTotals[monthKey]) {
            monthlyLocationTotals[monthKey] = {}
          }
          
          if (!monthlyLocationTotals[monthKey][item.location]) {
            monthlyLocationTotals[monthKey][item.location] = 0
          }
          
          monthlyLocationTotals[monthKey][item.location] += item.rainfall
        }
      })
      
      // Get the latest month or filtered month
      const months = Object.keys(monthlyLocationTotals).sort()
      const targetMonth = dateRange?.start ? 
        new Date(dateRange.start).toISOString().substring(0, 7) : 
        months[months.length - 1]
      
      if (monthlyLocationTotals[targetMonth]) {
        return Object.entries(monthlyLocationTotals[targetMonth]).map(([location, total]) => ({
          location,
          rainfall: total,
          month: targetMonth
        }))
      }
      
      return []
    }
    
    return dataSource
  }

  const aggregatedData = getAggregatedData()
  
  const getLabels = () => {
    // If showing daily data for a specific location
    if (type === "monthly-location-total" && selectedLocation && selectedLocation !== "all") {
      return aggregatedData.map((item: AggregatedDataItem) => {
        if (item.date) {
          const date = new Date(item.date)
          return date.toLocaleDateString("id-ID", { 
            day: "2-digit", 
            month: "short" 
          })
        }
        return ""
      })
    }
    
    if (type === "location-total" || type === "monthly-location-total") {
      return aggregatedData.map((item: AggregatedDataItem) => item.location || "Unknown")
    }
    if (type === "monthly") {
      return dataSource.map((item) => item.date || "")
    }
    return dataSource.map((item) => {
      if (item.date) {
        const date = new Date(item.date)
        return date.toLocaleDateString("id-ID", { 
          day: "2-digit", 
          month: "short" 
        })
      }
      return ""
    })
  }

  const getChartLabel = () => {
    switch (type) {
      case "location-total":
        const period = dateRange ? 
          ` (${new Date(dateRange.start || '').toLocaleDateString('id-ID')} - ${new Date(dateRange.end || '').toLocaleDateString('id-ID')})` : 
          ""
        return `Total Curah Hujan per Lokasi${period}`
      case "monthly-location-total":
        // If specific location is selected, show daily data for that location
        if (selectedLocation && selectedLocation !== "all") {
          const targetMonth = dateRange?.start ? 
            new Date(dateRange.start).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) :
            new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          return `Curah Hujan Harian - ${selectedLocation} (${targetMonth})`
        }
        const targetMonth = dateRange?.start ? 
          new Date(dateRange.start).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) :
          new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        return `Total Curah Hujan per Lokasi - ${targetMonth}`
      case "monthly":
        return "Curah Hujan Bulanan (mm)"
      default:
        return "Curah Hujan Harian (mm)"
    }
  }

  const getXAxisLabel = () => {
    switch (type) {
      case "location-total":
        return "Lokasi"
      case "monthly-location-total":
        // If specific location is selected, show date labels
        if (selectedLocation && selectedLocation !== "all") {
          return "Tanggal"
        }
        return "Lokasi"
      case "monthly":
        return "Bulan"
      default:
        return "Tanggal"
    }
  }

  const getYAxisLabel = () => {
    switch (type) {
      case "location-total":
        return "Lokasi"
      case "monthly-location-total":
        // If specific location is selected, show date labels for horizontal orientation
        if (selectedLocation && selectedLocation !== "all") {
          return "Tanggal"
        }
        return "Lokasi"
      case "monthly":
        return "Bulan"
      default:
        return "Tanggal"
    }
  }

  const datasets = [
    {
      label: getChartLabel(),
      data: aggregatedData.map((item: AggregatedDataItem) => item.rainfall),
      backgroundColor: "rgba(59, 130, 246, 0.8)",
      borderColor: "rgb(59, 130, 246)",
      borderWidth: 1,
      borderRadius: 4,
    }
  ]

  // Add comparison data if provided (not applicable for location-total type)
  if (showComparison && comparisonData && type !== "location-total" && type !== "monthly-location-total") {
    datasets.push({
      label: comparisonData[0]?.label || "Perbandingan",
      data: comparisonData.map((item) => item.value),
      backgroundColor: "rgba(156, 163, 175, 0.8)",
      borderColor: "rgb(156, 163, 175)",
      borderWidth: 1,
      borderRadius: 4,
    })
  }

  const chartData = {
    labels: getLabels(),
    datasets
  }

  // If no data available, show a message
  if (aggregatedData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Tidak ada data tersedia untuk lokasi dan periode yang dipilih</p>
          <p className="text-gray-400 text-xs mt-1">
            {selectedLocation && selectedLocation !== "all" 
              ? `Lokasi: ${selectedLocation}` 
              : "Pilih lokasi atau ubah filter tanggal"
            }
          </p>
        </div>
      </div>
    )
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: orientation === "horizontal" ? "y" as const : "x" as const,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: { dataset: { label?: string }; parsed: { y?: number; x?: number } }) {
            const value = context.parsed.y || context.parsed.x || 0
            if (type === "location-total" || type === "monthly-location-total") {
              return `${context.dataset.label}: ${value.toFixed(2)} mm`
            }
            return `${context.dataset.label}: ${value} mm`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: orientation === "vertical" ? "Curah Hujan (mm)" : getYAxisLabel(),
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        title: {
          display: true,
          text: orientation === "vertical" ? getXAxisLabel() : "Curah Hujan (mm)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  }

  return (
    <div className="h-80">
      {aggregatedData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">Tidak ada data tersedia</p>
            <p className="text-sm">
              {type === "monthly-location-total" && selectedLocation && selectedLocation !== "all" 
                ? `untuk lokasi ${selectedLocation} dan periode yang dipilih`
                : "untuk periode yang dipilih"
              }
            </p>
            <p className="text-xs mt-2">
              Lokasi: {selectedLocation || "Semua"} | 
              Data items: {dataSource.length} | 
              Type: {type} |
              Aggregated: {aggregatedData.length}
            </p>
            {useApiData && apiData && (
              <p className="text-xs text-blue-600 mt-1">
                API Data Count: {apiData.data?.records.length || 0}
              </p>
            )}
            {selectedLocation && selectedLocation !== "all" && dataSource.length > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                Locations in data: {Array.from(new Set(dataSource.map(d => d.location))).join(", ")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  )
}