"use client"

import * as React from "react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { Loader2 } from "lucide-react"
import { useRainfallData } from "@/lib/hooks"
import { 
  transformRainfallDataForCharts, 
  calculateTotalRainfallByLocation,
  calculateMonthlyAggregates 
} from "@/lib/utils/data-transformers"
import type { RainfallData } from "@/lib/types"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface EnhancedRainfallBarChartProps {
  data?: RainfallData[]
  selectedLocation?: string
  dateRange?: {
    start: string
    end: string
  }
  useApiData?: boolean
  type?: "daily" | "monthly" | "location-total"
  orientation?: "vertical" | "horizontal"
  height?: string
}

export function EnhancedRainfallBarChart({ 
  data = [], 
  selectedLocation,
  dateRange,
  useApiData = false,
  type = "daily",
  orientation = "vertical",
  height = "h-80"
}: EnhancedRainfallBarChartProps) {
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

  // Transform and prepare chart data
  const chartData = React.useMemo(() => {
    let dataSource = data
    
    if (useApiData && apiData?.data) {
      dataSource = transformRainfallDataForCharts(apiData.data)
    }

    let processedData: Array<{ label: string; value: number; location?: string }>
    let chartTitle = "Curah Hujan"

    switch (type) {
      case "location-total":
        const locationTotals = calculateTotalRainfallByLocation(dataSource)
        processedData = locationTotals.map(item => ({
          label: item.location,
          value: item.rainfall,
          location: item.location
        }))
        chartTitle = "Total Curah Hujan per Lokasi"
        break

      case "monthly":
        const monthlyAggregates = calculateMonthlyAggregates(dataSource)
        processedData = monthlyAggregates.map(item => ({
          label: new Date(item.month + '-01').toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
          value: item.rainfall,
        }))
        chartTitle = "Total Curah Hujan Bulanan"
        break

      case "daily":
      default:
        // Sort by date and take recent data
        const sortedData = [...dataSource]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 30) // Last 30 days
          .reverse()

        processedData = sortedData.map(item => ({
          label: new Date(item.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
          value: item.rainfall,
          location: item.location
        }))
        chartTitle = "Curah Hujan Harian"
        break
    }

    const colors = [
      "rgba(59, 130, 246, 0.8)",
      "rgba(16, 185, 129, 0.8)",
      "rgba(245, 158, 11, 0.8)",
      "rgba(239, 68, 68, 0.8)",
      "rgba(139, 92, 246, 0.8)",
      "rgba(236, 72, 153, 0.8)",
    ]

    return {
      labels: processedData.map(item => item.label),
      datasets: [
        {
          label: chartTitle + " (mm)",
          data: processedData.map(item => item.value),
          backgroundColor: type === "location-total" 
            ? processedData.map((_, index) => colors[index % colors.length])
            : "rgba(59, 130, 246, 0.8)",
          borderColor: type === "location-total"
            ? processedData.map((_, index) => colors[index % colors.length].replace('0.8', '1'))
            : "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    }
  }, [data, apiData, useApiData, type])

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
          afterLabel: (context: any) => {
            if (type === "location-total") {
              return `Lokasi: ${context.label}`
            }
            return undefined
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: orientation === "horizontal" ? "Periode" : "Curah Hujan (mm)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        title: {
          display: true,
          text: orientation === "horizontal" ? "Curah Hujan (mm)" : "Periode",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  }

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

  return (
    <div className={height}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
