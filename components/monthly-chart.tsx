"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface MonthlyChartProps {
  data: Array<{
    month: string
    rainfall: number
    average: number
  }>
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Curah Hujan Aktual (mm)",
        data: data.map((item) => item.rainfall),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
      {
        label: "Rata-rata Historis (mm)",
        data: data.map((item) => item.average),
        backgroundColor: "rgba(156, 163, 175, 0.8)",
        borderColor: "rgb(156, 163, 175)",
        borderWidth: 1,
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
          text: "Bulan",
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
