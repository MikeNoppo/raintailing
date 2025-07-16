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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Generate sample rainfall data for multiple stations
const generateRainfallData = () => {
  const data = []
  const startDate = new Date("2024-04-01")

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Generate realistic rainfall patterns for each station
    const stationA = Math.max(0, Math.random() * 50 + Math.sin(i * 0.1) * 20)
    const stationB = Math.max(0, Math.random() * 45 + Math.cos(i * 0.08) * 15)
    const stationC = Math.max(0, Math.random() * 40 + Math.sin(i * 0.12) * 25)

    data.push({
      date: date.toISOString().split("T")[0],
      stationA: Math.round(stationA * 10) / 10,
      stationB: Math.round(stationB * 10) / 10,
      stationC: Math.round(stationC * 10) / 10,
    })
  }

  return data
}

const chartData = generateRainfallData()

const chartConfig = {
  stationA: {
    label: "Stasiun A",
    color: "hsl(var(--chart-1))",
  },
  stationB: {
    label: "Stasiun B",
    color: "hsl(var(--chart-2))",
  },
  stationC: {
    label: "Stasiun C",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface RainfallAreaChartProps {
  data?: Array<{
    date: string
    rainfall: number
    location: string
    level: string
  }>
}

export function AreaChart({ data: propData }: RainfallAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = React.useMemo(() => {
    return chartData.filter((item) => {
      const date = new Date(item.date)
      const referenceDate = new Date("2024-06-30") // Use a fixed reference date
      let daysToSubtract = 90

      if (timeRange === "30d") {
        daysToSubtract = 30
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }

      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }, [timeRange])

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Intensitas dan Akumulasi Hujan</CardTitle>
          <CardDescription>Perbandingan curah hujan antar stasiun dalam periode waktu</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Pilih periode waktu">
            <SelectValue placeholder="3 bulan terakhir" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              3 bulan terakhir
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              30 hari terakhir
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              7 hari terakhir
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
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
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                  indicator="dot"
                />
              }
            />
            <defs>
              <linearGradient id="fillStationA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-stationA)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-stationA)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillStationB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-stationB)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-stationB)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillStationC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-stationC)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-stationC)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="stationA"
              type="natural"
              fill="url(#fillStationA)"
              fillOpacity={0.4}
              stroke="var(--color-stationA)"
              stackId="a"
            />
            <Area
              dataKey="stationB"
              type="natural"
              fill="url(#fillStationB)"
              fillOpacity={0.4}
              stroke="var(--color-stationB)"
              stackId="a"
            />
            <Area
              dataKey="stationC"
              type="natural"
              fill="url(#fillStationC)"
              fillOpacity={0.4}
              stroke="var(--color-stationC)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RechartsAreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
