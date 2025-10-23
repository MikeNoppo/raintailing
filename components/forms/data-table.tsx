"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react"
import { useRainfallData, useRainfallMutations } from "@/lib/hooks"
import { useAuth } from "@/lib/hooks/useAuth"
import { FilterControls } from "@/components/forms/filter-controls"
import { MonthYearSelector } from "@/components/forms/month-year-selector"
import { formatDateToLocalISO } from "@/lib/utils"
import { RainfallEditDialog } from '@/components/forms/rainfall-edit-dialog'
import { format } from "date-fns"

interface DataTableProps {
  filters?: {
    location?: string
    dateRange?: { from: Date; to: Date }
  }
  onFilterChange?: (newFilters: {
    location: string;
    dateRange?: { from: Date; to: Date };
  }) => void
}

export function DataTable({ filters, onFilterChange }: DataTableProps) {
  // State untuk pagination dan sorting
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // State untuk export dialog
  const [showExportDialog, setShowExportDialog] = useState(false)

  // API data fetching
  const apiFilters = useMemo(() => ({
    location: filters?.location && filters.location !== 'all' ? filters.location : undefined,
    startDate: filters?.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: filters?.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    order: sortOrder
  }), [filters, currentPage, pageSize, sortBy, sortOrder])

  // Reset page when external filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters?.location, filters?.dateRange?.from, filters?.dateRange?.to])

  const { 
    data: apiResponse, 
    error: apiError, 
    isLoading: apiLoading,
    mutate: refreshData
  } = useRainfallData(apiFilters)

  const { deleteRainfallData, isDeleting } = useRainfallMutations()

  // Edit dialog state
  const [editId, setEditId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Check user authentication and role
  const { user, isAuthenticated } = useAuth()
  const isAdmin = isAuthenticated && user?.role === 'ADMIN'

  // Transform API data
  const tableData = useMemo(() => {
    if (apiResponse?.data) {
      return apiResponse.data.map(item => ({
        id: item.id,
        date: item.date,
        rainfall: item.rainfall,
        location: item.location.name,
        locationCode: item.location.code,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    }
    return []
  }, [apiResponse])

  // Pagination info
  const pagination = apiResponse?.pagination || {
    page: 1,
    limit: 0,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  }

  // Export function - opens dialog instead of immediate export
  const handleExportClick = () => {
    setShowExportDialog(true)
  }

  // Delete function (only for API mode)
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    
    try {
      await deleteRainfallData(id)
      await refreshData() // Refresh table data
    } catch {
      // Error already handled in hook
    }
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setCurrentPage(1)
  }

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      {onFilterChange && <FilterControls filters={filters} onFilterChange={onFilterChange} />}
      
      {/* Data Table */}
      <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle>Data Curah Hujan (Real-time)</CardTitle>
            {filters && (
              <p className="text-sm text-muted-foreground mt-1">
                {filters.location && filters.location !== 'all' && `Lokasi: ${filters.location} • `}
                {filters.dateRange && `${filters.dateRange.from.toLocaleDateString('id-ID')} - ${filters.dateRange.to.toLocaleDateString('id-ID')}`}
              </p>
            )}
          </div>
          <Button onClick={handleExportClick} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tampilkan:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {apiLoading && <span>Memuat data...</span>}
          {apiError && <span className="text-destructive">Error: {apiError.message}</span>}
          {!apiLoading && !apiError && (
            <span>
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
            </span>
          )}
          {isAuthenticated && (
            <span className="text-xs">
              • Login sebagai: <span className={`font-medium ${isAdmin ? 'text-red-600' : 'text-blue-600'}`}>
                {user?.role}
              </span>
              {!isAdmin && ' (Read-only)'}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('date')}
                >
                  Tanggal
                  {sortBy === 'date' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('rainfall')}
                >
                  Curah Hujan (mm)
                  {sortBy === 'rainfall' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('location')}
                >
                  Lokasi
                  {sortBy === 'location' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
                {isAdmin && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => {
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      {new Date(row.date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{row.rainfall}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.location}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.locationCode}
                        </span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Edit"
                            onClick={() => { setEditId(row.id); setShowEditDialog(true) }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Delete"
                            onClick={() => handleDelete(row.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* No data message */}
        {tableData.length === 0 && !apiLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada data yang ditemukan dengan filter yang dipilih
          </div>
        )}

        {/* Loading skeleton */}
        {apiLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => index).map((index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/6"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
                {isAdmin && <div className="h-4 bg-muted animate-pulse rounded w-16"></div>}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || apiLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || apiLoading}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Month/Year Export Dialog */}
    <MonthYearSelector
      open={showExportDialog}
      onClose={() => setShowExportDialog(false)}
      currentLocation={filters?.location}
    />
    <RainfallEditDialog 
      id={editId}
      open={showEditDialog}
      onClose={() => { setShowEditDialog(false); setEditId(null) }}
      onUpdated={() => refreshData()}
    />
    </div>
  )
}
