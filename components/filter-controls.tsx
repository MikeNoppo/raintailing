"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

interface FilterControlsProps {
  onFilterChange: (filters: any) => void
}

export function FilterControls({ onFilterChange }: FilterControlsProps) {
  const [location, setLocation] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleLocationChange = (value: string) => {
    setLocation(value)
    onFilterChange({ location: value, dateRange })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    onFilterChange({ location, dateRange: range })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Lokasi Stasiun</label>
              <Select value={location} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  <SelectItem value="Station A">Stasiun A</SelectItem>
                  <SelectItem value="Station B">Stasiun B</SelectItem>
                  <SelectItem value="Station C">Stasiun C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Rentang Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: id })
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setLocation("all")
              setDateRange(undefined)
              onFilterChange({ location: "all", dateRange: undefined })
            }}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
