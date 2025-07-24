"use client"

import * as React from "react"
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useRainfallClassification } from "@/lib/hooks"

// Rainfall classification based on Indonesian meteorological standards
export const rainfallCategories = {
  ringan: {
    label: "Hujan Ringan",
    description: "0.1 - 20 mm per hari",
    min: 0.1,
    max: 20,
    color: "#22c55e", // green
    emoji: "🌦️"
  },
  sedang: {
    label: "Hujan Sedang", 
    description: "20 - 50 mm per hari",
    min: 20,
    max: 50,
    color: "#f59e0b", // amber
    emoji: "☔"
  },
  lebat: {
    label: "Hujan Lebat",
    description: "lebih dari 50 mm per hari", 
    min: 50,
    max: Infinity,
    color: "#ef4444", // red
    emoji: "🌧️"
  },
  tidakHujan: {
    label: "Tidak Hujan",
    description: "0 mm",
    min: 0,
    max: 0,
    color: "#94a3b8", // gray
    emoji: "☀️"
  }
}

// Function to classify rainfall amount
export const classifyRainfall = (amount: number): keyof typeof rainfallCategories => {
  if (amount === 0) return "tidakHujan"
  if (amount > 0 && amount <= 20) return "ringan"
  if (amount > 20 && amount <= 50) return "sedang"
  return "lebat"
}

// Function to process rainfall data and get classification counts
export const processRainfallClassification = (data: Array<{ rainfall: number, location?: string }>, location?: string) => {
  // Filter by location if specified
  const filteredData = location 
    ? data.filter(item => item.location === location)
    : data

  // Count occurrences of each category
  const counts = {
    tidakHujan: 0,
    ringan: 0,
    sedang: 0,
    lebat: 0
  }

  filteredData.forEach(item => {
    const category = classifyRainfall(item.rainfall)
    counts[category]++
  })

  // Convert to chart data format
  return Object.entries(counts).map(([key, count]) => {
    const category = rainfallCategories[key as keyof typeof rainfallCategories]
    return {
      name: category.label,
      value: count,
      percentage: filteredData.length > 0 ? ((count / filteredData.length) * 100).toFixed(1) : "0",
      color: category.color,
      emoji: category.emoji,
      description: category.description
    }
  }).filter(item => item.value > 0) // Only show categories with data
}

const chartConfig = {
  tidakHujan: {
    label: "Tidak Hujan",
  },
  ringan: {
    label: "Hujan Ringan",
  },
  sedang: {
    label: "Hujan Sedang", 
  },
  lebat: {
    label: "Hujan Lebat",
  },
} satisfies ChartConfig

interface RainfallClassificationChartProps {
  location?: string
  dateRange?: {
    start: string
    end: string
  }
  showAsDonut?: boolean
  title?: string
  description?: string
  useApiData?: boolean // New prop to enable API data
}

export function RainfallClassificationChart({ 
  location, 
  dateRange,
  showAsDonut = true,
  title = "Klasifikasi Curah Hujan",
  description = "Proporsi kategori curah hujan berdasarkan data harian",
  useApiData = true // Default to true for API integration
}: RainfallClassificationChartProps) {
  // Use API data when enabled
  const { 
    chartData: apiChartData, 
    summary, 
    isLoading, 
    error, 
    isEmpty 
  } = useRainfallClassification({
    location: location === 'all' ? undefined : location,
    startDate: dateRange?.start,
    endDate: dateRange?.end
  })

  // Loading state
  if (useApiData && isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[300px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (useApiData && error) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>
            Failed to load classification data
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Unable to fetch rainfall classification data</p>
            <p className="text-sm mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (useApiData && isEmpty) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description}
            {location && location !== 'all' && ` - ${location}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No rainfall data available</p>
            <p className="text-sm mt-1">for the selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = useApiData ? apiChartData : []
  const totalDays = useApiData ? (summary?.totalDays || 0) : 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {location && location !== 'all' && ` - ${location}`}
          {totalDays > 0 && ` (${totalDays} hari)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RechartsPieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent 
                  hideLabel 
                  formatter={(value, name, props) => (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>{props.payload?.emoji}</span>
                        <span className="font-medium">{name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {value} hari ({props.payload?.percentage}%)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {props.payload?.description}
                      </div>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={showAsDonut ? 60 : 0}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                />
              ))}
            </Pie>
            <ChartLegend
              content={({ payload }) => (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {payload?.map((entry, index) => {
                    const data = chartData.find(item => item.name === entry.value)
                    return (
                      <div 
                        key={`legend-${index}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="flex-1">{data?.emoji} {entry.value}</span>
                        <span className="font-medium">{data?.percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            />
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Helper component for showing classification summary
export function RainfallClassificationSummary({ 
  location,
  dateRange,
  useApiData = true
}: { 
  location?: string
  dateRange?: { start: string, end: string }
  useApiData?: boolean
}) {
  // Use API data when enabled
  const { 
    chartData: apiChartData, 
    summary, 
    isLoading, 
    error, 
    isEmpty 
  } = useRainfallClassification({
    location: location === 'all' ? undefined : location,
    startDate: dateRange?.start,
    endDate: dateRange?.end
  })

  // Loading state
  if (useApiData && isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (useApiData && error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>Failed to load classification data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Unable to fetch rainfall classification data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (useApiData && isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan Klasifikasi</CardTitle>
          <CardDescription>
            Distribusi kategori curah hujan
            {location && location !== 'all' && ` untuk ${location}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>No rainfall data available for classification</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = useApiData ? apiChartData : []
  const totalDays = useApiData ? (summary?.totalDays || 0) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ringkasan Klasifikasi</CardTitle>
        <CardDescription>
          Distribusi kategori curah hujan
          {location && location !== 'all' && ` untuk ${location}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {chartData.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{item.value}</div>
                <div className="text-sm text-muted-foreground">
                  {item.percentage}% dari {totalDays} hari
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
