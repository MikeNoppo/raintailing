"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface RainfallBarChartProps {
  data: Array<{
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
}

export function RainfallBarChart({ 
  data, 
  type = "daily",
  orientation = "vertical",
  showComparison = false,
  comparisonData,
  dateRange
}: RainfallBarChartProps) {
  
  // Aggregate data by location when type is "location-total"
  const getAggregatedData = () => {
    if (type === "location-total") {
      const locationTotals: { [key: string]: number } = {}
      
      data.forEach(item => {
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
      
      data.forEach(item => {
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
    
    return data
  }

  const aggregatedData = getAggregatedData()
  
  const getLabels = () => {
    if (type === "location-total" || type === "monthly-location-total") {
      return aggregatedData.map((item: any) => item.location || "Unknown")
    }
    if (type === "monthly") {
      return data.map((item) => item.month || "")
    }
    return data.map((item) => {
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
      case "monthly":
        return "Bulan"
      default:
        return "Tanggal"
    }
  }

  const datasets = [
    {
      label: getChartLabel(),
      data: aggregatedData.map((item: any) => item.rainfall),
      backgroundColor: "rgba(59, 130, 246, 0.8)",
      borderColor: "rgb(59, 130, 246)",
      borderWidth: 1,
      borderRadius: 4,
    }
  ]

  // Add comparison data if provided (not applicable for location-total type)
  if (showComparison && comparisonData && type !== "location-total") {
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
          label: function(context: any) {
            const value = context.parsed.y || context.parsed.x
            if (type === "location-total") {
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
      <Bar data={chartData} options={options} />
    </div>
  )
}