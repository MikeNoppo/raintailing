"use client"

import * as React from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Loader2 } from "lucide-react"
import { useRainfallData } from "@/lib/hooks"
import { transformRainfallDataForCharts } from "@/lib/utils/data-transformers"
import type { RainfallData } from "@/lib/types"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface EnhancedRainfallChartProps {
  data?: RainfallData[]
  selectedLocation?: string
  dateRange?: {
    start: string
    end: string
  }
  useApiData?: boolean
  height?: string
}

export function EnhancedRainfallChart({ 
  data = [], 
  selectedLocation,
  dateRange,
  useApiData = false,
  height = "h-80"
}: EnhancedRainfallChartProps) {
  // Fetch data from API if useApiData is true
  const { 
    data: apiData, 
    error: apiError, 
    isLoading: apiLoading 
  } = useRainfallData(
    useApiData ? {
      location: selectedLocation,
      startDate: dateRange?.start,
      endDate: dateRange?.end,
      sortBy: 'date',
      order: 'asc',
      limit: 500
    } : {}
  )

  // Transform and prepare chart data
  const chartData = React.useMemo(() => {
    let dataSource = data
    
    if (useApiData && apiData?.data) {
      dataSource = transformRainfallDataForCharts(apiData.data)
    }

    // Sort by date
    const sortedData = [...dataSource].sort((a, b) => a.date.localeCompare(b.date))

    return {
      labels: sortedData.map((item) => {
        const date = new Date(item.date)
        return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" })
      }),
      datasets: [
        {
          label: "Curah Hujan (mm)",
          data: sortedData.map((item) => item.rainfall),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: sortedData.map(() => "rgb(59, 130, 246)"),
          pointBorderColor: sortedData.map(() => "rgb(59, 130, 246)"),
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  }, [data, apiData, useApiData])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: { dataIndex: number }) => {
            const dataIndex = context.dataIndex
            let dataSource = data
            
            if (useApiData && apiData?.data) {
              dataSource = transformRainfallDataForCharts(apiData.data)
            }
            
            const sortedData = [...dataSource].sort((a, b) => a.date.localeCompare(b.date))
            return `Lokasi: ${sortedData[dataIndex]?.location || 'N/A'}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Curah Hujan (mm)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Tanggal",
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
      <Line data={chartData} options={options} />
    </div>
  )
}
