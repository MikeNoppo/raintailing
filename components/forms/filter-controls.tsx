"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, X, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { useLocations } from "@/lib/hooks/useLocations"

interface FilterControlsProps {
  onFilterChange: (filters: {
    location: string;
    dateRange?: { from: Date; to: Date };
  }) => void
}

export function FilterControls({ onFilterChange }: FilterControlsProps) {
  const [location, setLocation] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Fetch locations from API
  const { locations, loading: locationsLoading, error: locationsError, refetch } = useLocations({ 
    status: 'ACTIVE', 
    autoRefresh: true, 
    refreshInterval: 60000 
  })

  const handleLocationChange = (value: string) => {
    setLocation(value)
    const convertedRange = dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined
    onFilterChange({ location: value, dateRange: convertedRange })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    const convertedRange = range?.from && range?.to ? { from: range.from, to: range.to } : undefined
    onFilterChange({ location, dateRange: convertedRange })
  }

  const clearDateRange = () => {
    setDateRange(undefined)
    onFilterChange({ location, dateRange: undefined })
  }

  const resetAllFilters = () => {
    setLocation("all")
    setDateRange(undefined)
    onFilterChange({ location: "all", dateRange: undefined })
  }

  const hasActiveFilters = location !== "all" || dateRange

  return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter Data:</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="text-gray-600 hover:text-gray-800 border-gray-300 bg-transparent"
              >
                <X className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Lokasi Stasiun</label>
                {locationsError && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refetch}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={location} onValueChange={handleLocationChange} disabled={locationsLoading}>
                <SelectTrigger className="w-full bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={locationsLoading ? "Memuat lokasi..." : "Pilih lokasi"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all" className="hover:bg-gray-50">
                    Semua Lokasi
                  </SelectItem>
                  {locationsError ? (
                    <SelectItem value="error" disabled className="text-red-500">
                      Error memuat lokasi
                    </SelectItem>
                  ) : locations.length > 0 ? (
                    locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.code} className="hover:bg-gray-50">
                        {loc.name} ({loc.code})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-locations" disabled className="hover:bg-gray-50">
                      {locationsLoading ? "Memuat..." : "Tidak ada lokasi aktif"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Rentang Tanggal</label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500",
                        !dateRange && "text-gray-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <span className="text-gray-900">
                            {format(dateRange.from, "dd MMM", { locale: id })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                          </span>
                        ) : (
                          <span className="text-gray-900">{format(dateRange.from, "dd MMM yyyy", { locale: id })}</span>
                        )
                      ) : (
                        <span>Pilih rentang tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white border-gray-200 shadow-lg"
                    align="start"
                    sideOffset={4}
                  >
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      className="rounded-md"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                        day_selected:
                          "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                        day_today: "bg-gray-100 text-gray-900",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-400 opacity-50",
                        day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-900",
                        day_hidden: "invisible",
                      }}
                    />
                    {dateRange && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateRange}
                          className="w-full text-gray-600 hover:text-gray-800 border-gray-300 bg-transparent"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Hapus Tanggal
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Clear date range button */}
                {dateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Filter Cepat</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    const range = { from: lastWeek, to: today }
                    handleDateRangeChange(range)
                  }}
                  className="text-xs bg-white border-gray-300 hover:bg-gray-50"
                >
                  7 Hari
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    const range = { from: lastMonth, to: today }
                    handleDateRangeChange(range)
                  }}
                  className="text-xs bg-white border-gray-300 hover:bg-gray-50"
                >
                  30 Hari
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const lastYear = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
                    const range = { from: lastYear, to: today }
                    handleDateRangeChange(range)
                  }}
                  className="text-xs bg-white border-gray-300 hover:bg-gray-50"
                >
                  1 Tahun
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-600">Filter aktif:</span>
              {location !== "all" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {locations.find(loc => loc.code === location)?.name || location}
                  <button
                    onClick={() => handleLocationChange("all")}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </span>
              )}
              {dateRange && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "dd MMM", { locale: id })} - ${format(dateRange.to, "dd MMM", { locale: id })}`
                    : dateRange.from
                      ? format(dateRange.from, "dd MMM yyyy", { locale: id })
                      : "Tanggal dipilih"}
                  <button onClick={clearDateRange} className="ml-1 hover:bg-green-200 rounded-full p-0.5">
                    <X className="h-2 w-2" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
