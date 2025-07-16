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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface RainfallChartProps {
  data: Array<{
    date: string
    rainfall: number
    location: string
    level: string
  }>
}

export function RainfallChart({ data }: RainfallChartProps) {
  const chartData = {
    labels: data.map((item) => {
      const date = new Date(item.date)
      return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        label: "Curah Hujan (mm)",
        data: data.map((item) => item.rainfall),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: data.map((item) => {
          if (item.level === "danger") return "rgb(239, 68, 68)"
          if (item.level === "warning") return "rgb(245, 158, 11)"
          return "rgb(34, 197, 94)"
        }),
        pointBorderColor: data.map((item) => {
          if (item.level === "danger") return "rgb(239, 68, 68)"
          if (item.level === "warning") return "rgb(245, 158, 11)"
          return "rgb(34, 197, 94)"
        }),
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
          afterLabel: (context: any) => {
            const dataIndex = context.dataIndex
            const level = data[dataIndex].level
            const levelText = level === "danger" ? "Bahaya" : level === "warning" ? "Peringatan" : "Normal"
            return `Status: ${levelText}`
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
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  )
}
