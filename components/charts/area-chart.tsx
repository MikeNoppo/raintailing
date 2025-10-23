"use client"

import * as React from "react"
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Loader2 } from "lucide-react"
import { useRainfallData } from "@/lib/hooks"
import { useLocations } from "@/lib/hooks/useLocations"
import { formatDateToLocalISO } from "@/lib/utils"

// Default locations based on location-management.tsx
const defaultLocations: Location[] = [
  { id: "1", name: "Gosowong Pit", code: "GSW-PIT", status: "active" },
  { id: "2", name: "Gosowong Helipad (DP3)", code: "GSW-DP3", status: "active" },
  { id: "3", name: "Tailing dam (TSF)", code: "TSF", status: "active" },
  { id: "4", name: "Kencana (Portal)", code: "KNC-PRT", status: "active" },
  { id: "5", name: "Toguraci (Portal)", code: "TGR-PRT", status: "active" },
  { id: "6", name: "Gosowong North", code: "GSW-NTH", status: "active" },
]

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

// Color configuration for each location with special color for Toguraci
const chartConfig = {
  "GSW-PIT": {
    label: "Gosowong Pit",
    color: "hsl(220, 70%, 50%)", // Blue
  },
  "GSW-DP3": {
    label: "Gosowong Helipad (DP3)",
    color: "hsl(142, 76%, 36%)", // Green
  },
  "TSF": {
    label: "Tailing dam (TSF)",
    color: "hsl(47, 96%, 53%)", // Yellow
  },
  "KNC-PRT": {
    label: "Kencana (Portal)",
    color: "hsl(280, 87%, 47%)", // Purple
  },
  "TGR-PRT": {
    label: "Toguraci (Portal)",
    color: "hsl(348, 83%, 47%)", // Red - Special color for Toguraci
  },
  "GSW-NTH": {
    label: "Gosowong North",
    color: "hsl(24, 90%, 50%)", // Orange
  },
} satisfies ChartConfig

interface Location {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface RainfallAreaChartProps {
  data?: Array<{
    date: string
    rainfall: number
    location: string
  }>
  filteredLocation?: string
  dateRange?: { from: Date; to: Date }
  useApiData?: boolean
}

export function AreaChart({ 
  data: propData, 
  filteredLocation = "all", 
  dateRange,
  useApiData = false 
}: RainfallAreaChartProps) {
  // Fetch locations from API - ALWAYS call this hook
  const { locations: apiLocations, loading: locationsLoading } = useLocations({ 
    status: 'ACTIVE', 
    autoRefresh: true, 
    refreshInterval: 60000 
  })

  // Fetch rainfall data from API if useApiData is true - ALWAYS call this hook
  const { 
    data: apiData, 
    error: apiError, 
    isLoading: apiLoading 
  } = useRainfallData(
    useApiData ? {
      location: filteredLocation !== "all" ? filteredLocation : undefined,
      startDate: formatDateToLocalISO(dateRange?.from),
      endDate: formatDateToLocalISO(dateRange?.to),
      limit: 500, // Increase limit for chart data
      sortBy: 'date',
      order: 'asc'
    } : undefined
  )

  // Use API data if available, otherwise fallback to prop data or default locations
  const dataSource = useApiData && apiData?.data?.records 
    ? apiData.data.records.map(item => ({
        date: item.date,
        rainfall: item.rainfall,
        location: item.location.code
      }))
    : propData

  const locations = useApiData ? (apiLocations || defaultLocations) : defaultLocations

  // Convert dataSource to chart format or generate data - ALWAYS call this hook
  const chartDataWithLocations = React.useMemo(() => {
    if (dataSource && dataSource.length > 0) {
      // Convert the API/prop data to chart format
      const dataMap = new Map()
      
      // Group data by date
      dataSource.forEach(item => {
        if (!dataMap.has(item.date)) {
          dataMap.set(item.date, { date: item.date })
        }
        dataMap.get(item.date)[item.location] = item.rainfall
      })
      
      // Convert map to array and sort by date
      return Array.from(dataMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    } else if (!useApiData) {
      // Fallback to generated data only if not using API data
      const data = []
      const startDate = new Date("2024-04-01")

      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)

        const dataPoint: DataPoint = {
          date: date.toISOString().split("T")[0],
        }

        // Generate data for each active location
        locations.forEach((location, index) => {
          const baseRainfall = Math.max(0, Math.random() * 50 + Math.sin(i * (0.1 + index * 0.02)) * 20)
          dataPoint[location.code] = Math.round(baseRainfall * 10) / 10
        })

        data.push(dataPoint)
      }

      return data
    }
    
    return []
  }, [locations, dataSource, useApiData])

  // Filter locations based on filter controls - ALWAYS call this hook
  const displayedLocations = React.useMemo(() => {
    if (filteredLocation === "all") {
      return locations
    }
    return locations.filter(location => location.code === filteredLocation)
  }, [locations, filteredLocation])

  // Filter chart data - ALWAYS call this hook
  const filteredData = React.useMemo(() => {
    const filtered = chartDataWithLocations.filter((item) => {
      const date = new Date(item.date)
      
      // Apply date range filter from filter controls if provided
      if (dateRange?.from && dateRange?.to) {
        return date >= dateRange.from && date <= dateRange.to
      }
      
      // If using API data or prop data, don't apply default date filter
      if (dataSource && dataSource.length > 0) {
        return true
      }
      
      // If no date filter and using generated data, show last 90 days by default
      const referenceDate = new Date("2024-06-30") // Use a fixed reference date
      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - 90)
      return date >= startDate
    })

    // Ensure all displayed locations have data (fill with 0 if missing)
    return filtered.map(item => {
      const filledItem = { ...item }
      displayedLocations.forEach(location => {
        if (filledItem[location.code] === undefined) {
          filledItem[location.code] = 0
        }
      })
      return filledItem
    })
  }, [chartDataWithLocations, dateRange, dataSource, displayedLocations])

  // Generate dynamic chart config based on displayed locations - ALWAYS call this hook
  const dynamicChartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    displayedLocations.forEach((location) => {
      config[location.code] = {
        label: location.name,
        color: chartConfig[location.code as keyof typeof chartConfig]?.color || "hsl(0, 0%, 50%)",
      }
    })
    return config
  }, [displayedLocations])

  // Loading state for API data
  if (useApiData && (apiLoading || locationsLoading)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intensitas dan Akumulasi Hujan</CardTitle>
          <CardDescription>Loading data from database...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Error state for API data
  if (useApiData && apiError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intensitas dan Akumulasi Hujan</CardTitle>
          <CardDescription>Error loading data from database</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">Failed to load data</p>
            <p className="text-sm">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Intensitas dan Akumulasi Hujan</CardTitle>
          <CardDescription>
            {filteredLocation !== "all" 
              ? `Data curah hujan untuk ${displayedLocations[0]?.name || filteredLocation}`
              : `Perbandingan curah hujan antar ${displayedLocations.length} stasiun ${useApiData ? 'dari database real-time' : (dataSource && dataSource.length > 0 ? 'berdasarkan data real' : 'dalam periode waktu')}`
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {displayedLocations.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Tidak ada data lokasi yang tersedia</p>
              <p className="text-sm">Pastikan ada lokasi aktif yang dipilih di filter</p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Tidak ada data untuk periode yang dipilih</p>
              <p className="text-sm">Coba ubah rentang tanggal atau pilih periode yang berbeda</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={dynamicChartConfig} className="aspect-auto h-[300px] w-full">
          <RechartsAreaChart
            accessibilityLayer
            data={filteredData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}mm`} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }}
                  formatter={(value, name) => [
                    `${value} mm`,
                    dynamicChartConfig[name as keyof typeof dynamicChartConfig]?.label || name,
                  ]}
                  indicator="dot"
                />
              }
            />
            <defs>
              {displayedLocations.map((location) => (
                <linearGradient key={location.code} id={`fill${location.code}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfig[location.code as keyof typeof chartConfig]?.color || "hsl(0, 0%, 50%)"} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartConfig[location.code as keyof typeof chartConfig]?.color || "hsl(0, 0%, 50%)"} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            {displayedLocations.map((location) => (
              <Area
                key={location.code}
                dataKey={location.code}
                type="natural"
                fill={`url(#fill${location.code})`}
                fillOpacity={0.4}
                stroke={chartConfig[location.code as keyof typeof chartConfig]?.color || "hsl(0, 0%, 50%)"}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </RechartsAreaChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
