"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar, MapPin, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAvailableDates, getAvailableYears, getAvailableMonthsForYear, getIndonesianMonthName } from "@/lib/hooks/useAvailableDates"
import { ExportMode } from "@/lib/types"

interface MonthYearSelectorProps {
  open: boolean
  onClose: () => void
  currentLocation?: string
}

export function MonthYearSelector({ open, onClose, currentLocation }: MonthYearSelectorProps) {
  const [exportMode, setExportMode] = useState<ExportMode>('monthly')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const { months, isLoading, error, refetch } = useAvailableDates({
    location: currentLocation
  })

  const availableYears = getAvailableYears(months)
  const availableMonthsForYear = selectedYear ? getAvailableMonthsForYear(months, selectedYear) : []

  useEffect(() => {
    if (open) {
      setExportMode('monthly')
      setSelectedYear(null)
      setSelectedMonth(null)
      setIsDownloading(false)
    }
  }, [open, currentLocation])

  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  useEffect(() => {
    setSelectedMonth(null)
  }, [selectedYear, exportMode])

  const handleYearChange = (value: string) => {
    const year = parseInt(value)
    setSelectedYear(year)
    setSelectedMonth(null)
  }

  const handleMonthChange = (value: string) => {
    const month = parseInt(value)
    setSelectedMonth(month)
  }

  const handleDownload = async () => {
    if (!selectedYear) {
      toast.error("Silakan pilih tahun terlebih dahulu")
      return
    }

    if (exportMode === 'monthly' && !selectedMonth) {
      toast.error("Silakan pilih bulan terlebih dahulu")
      return
    }

    setIsDownloading(true)
    
    try {
      const queryParams = new URLSearchParams({
        year: selectedYear.toString(),
        ...(exportMode === 'monthly' && selectedMonth && { month: selectedMonth.toString() }),
        ...(currentLocation && currentLocation !== 'all' && { location: currentLocation })
      })

      const endpoint = exportMode === 'yearly' 
        ? `/api/rainfall/export/yearly?${queryParams}`
        : `/api/rainfall/export?${queryParams}`

      const response = await fetch(endpoint)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export data')
      }

      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : exportMode === 'yearly'
          ? `Laporan_Tahunan_${selectedYear}.xlsx`
          : `Data_Curah_Hujan_${getIndonesianMonthName(selectedMonth!)}_${selectedYear}.xlsx`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      const periodText = exportMode === 'yearly' 
        ? `Tahun ${selectedYear}` 
        : `${getIndonesianMonthName(selectedMonth!)} ${selectedYear}`
      toast.success(`Data ${periodText} berhasil diekspor`)
      onClose()
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengekspor data')
    } finally {
      setIsDownloading(false)
    }
  }

  const selectedPeriodData = availableMonthsForYear.find(m => m.month === selectedMonth)
  const dataCount = selectedPeriodData?.count || 0
  const yearlyDataCount = availableMonthsForYear.reduce((sum, m) => sum + m.count, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Export Data Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {currentLocation && currentLocation !== 'all' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <MapPin className="h-4 w-4" />
                  <span>Filter lokasi: <strong>{currentLocation}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Memuat data yang tersedia...</span>
            </div>
          )}

          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="text-sm text-red-700">
                  <p>Gagal memuat data yang tersedia</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                    className="mt-2"
                  >
                    Coba Lagi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && months.length === 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="text-sm text-yellow-700">
                  <p>Tidak ada data yang tersedia untuk diekspor</p>
                  {currentLocation && currentLocation !== 'all' && (
                    <p className="mt-1">Coba ubah filter lokasi atau tambahkan data terlebih dahulu</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && months.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mode Export</label>
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={exportMode === 'monthly' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setExportMode('monthly')}
                  >
                    Bulanan
                  </Button>
                  <Button
                    type="button"
                    variant={exportMode === 'yearly' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setExportMode('yearly')}
                  >
                    Tahunan
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Tahun</label>
                <Select value={selectedYear?.toString() || ""} onValueChange={handleYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {exportMode === 'monthly' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Bulan</label>
                  <Select 
                    value={selectedMonth?.toString() || ""} 
                    onValueChange={handleMonthChange}
                    disabled={!selectedYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedYear ? "Pilih bulan" : "Pilih tahun terlebih dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonthsForYear.map(monthData => (
                        <SelectItem key={monthData.month} value={monthData.month.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{getIndonesianMonthName(monthData.month)}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({monthData.count} data)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedYear && (exportMode === 'yearly' || selectedMonth) && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <div className="text-green-700">
                        <p className="font-medium">
                          {exportMode === 'yearly' 
                            ? `Tahun ${selectedYear}` 
                            : `${getIndonesianMonthName(selectedMonth!)} ${selectedYear}`
                          }
                        </p>
                        <p className="text-xs">
                          {exportMode === 'yearly'
                            ? `${yearlyDataCount} data tersedia untuk tahun ini`
                            : `${dataCount} data tersedia untuk periode ini`
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose} disabled={isDownloading}>
              Batal
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={
                !selectedYear || 
                (exportMode === 'monthly' && (!selectedMonth || dataCount === 0)) ||
                (exportMode === 'yearly' && yearlyDataCount === 0) ||
                isDownloading
              }
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
