"use client"

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
import { getCurrentMonthRange } from "@/lib/utils/date-helpers"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface RainfallChartProps {
  selectedLocation?: string
  dateRange?: {
    start: string
    end: string
  }
  height?: string
}

export function RainfallChart({ 
  selectedLocation,
  dateRange,
  height = "h-80"
}: RainfallChartProps) {
  const defaultDateRange = !dateRange?.start && !dateRange?.end ? getCurrentMonthRange() : null
  const effectiveStartDate = dateRange?.start || defaultDateRange?.start
  const effectiveEndDate = dateRange?.end || defaultDateRange?.end

  const { 
    data: apiData, 
    error: apiError, 
    isLoading: apiLoading 
  } = useRainfallData({
    location: selectedLocation,
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    sortBy: 'date',
    order: 'asc',
    limit: 500
  })

  const dataSource = apiData?.data?.records 
    ? transformRainfallDataForCharts(apiData.data.records)
    : []

  if (apiLoading) {
    return (
      <div className={`${height} flex items-center justify-center`}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading chart data...</span>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className={`${height} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load chart data</div>
          <div className="text-sm text-muted-foreground">{apiError.message}</div>
        </div>
      </div>
    )
  }
  const chartData = {
    labels: dataSource.map((item) => {
      const date = new Date(item.date)
      return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        label: "Curah Hujan (mm)",
        data: dataSource.map((item) => item.rainfall),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: dataSource.map(() => "rgb(59, 130, 246)"),
        pointBorderColor: dataSource.map(() => "rgb(59, 130, 246)"),
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }

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
            return `Lokasi: ${dataSource[dataIndex]?.location || 'N/A'}`
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

  return (
    <div className={height}>
      <Line data={chartData} options={options} />
    </div>
  )
}
