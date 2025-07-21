import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export interface ExcelExportData {
  date: string
  rainfall: number
  location: string
}

export interface LocationExportData {
  id: string
  name: string
  code: string
  description?: string
  coordinates?: {
    lat: number
    lng: number
  }
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface PivotRainfallData {
  date: string
  [locationCode: string]: string | number // Dynamic location columns
}

/**
 * Export rainfall data in pivot table format (locations as columns)
 */
export const exportRainfallPivotToExcel = async (
  data: ExcelExportData[],
  filename?: string
) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Rainfall Data')

    // Get unique locations and sort by date
    const locations = [...new Set(data.map(d => d.location))].sort()
    const dates = [...new Set(data.map(d => d.date))].sort()

    // Create pivot data structure
    const pivotData: { [date: string]: { [location: string]: number } } = {}
    
    data.forEach(item => {
      if (!pivotData[item.date]) {
        pivotData[item.date] = {}
      }
      pivotData[item.date][item.location] = item.rainfall
    })

    // Set up headers
    const headers = ['Date', ...locations.map(loc => `${loc}`)]
    worksheet.addRow(headers)

    // Style the main header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add subheader for units
    const subHeaders = ['', ...locations.map(() => 'Location (mm/day)')]
    const subHeaderRow = worksheet.addRow(subHeaders)
    subHeaderRow.font = { bold: true, size: 10 }
    subHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    }

    // Merge cells for the location header
    worksheet.mergeCells('B1', `${String.fromCharCode(66 + locations.length - 1)}1`)
    const locationHeaderCell = worksheet.getCell('B1')
    locationHeaderCell.value = 'Location (mm/day)'
    locationHeaderCell.alignment = { horizontal: 'center' }

    // Add data rows
    dates.forEach(date => {
      const row: (string | number)[] = [
        new Date(date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        })
      ]
      
      locations.forEach(location => {
        row.push(pivotData[date]?.[location] || 0)
      })
      
      worksheet.addRow(row)
    })

    // Calculate statistics
    const stats: { [location: string]: any } = {}
    
    locations.forEach(location => {
      const locationData = data.filter(d => d.location === location)
      const rainfallValues = locationData.map(d => d.rainfall).filter(r => r > 0)
      
      stats[location] = {
        total: locationData.reduce((sum, d) => sum + d.rainfall, 0),
        average: locationData.length > 0 ? locationData.reduce((sum, d) => sum + d.rainfall, 0) / locationData.length : 0,
        peak: Math.max(...locationData.map(d => d.rainfall)),
        rainDays: rainfallValues.length,
        wetDays: locationData.filter(d => d.rainfall >= 1).length
      }
    })

    // Add summary rows
    const lastDataRow = worksheet.lastRow?.number || 2
    const summaryStartRow = lastDataRow + 2

    // Total row
    const totalRow = ['Total of June 2025', ...locations.map(loc => stats[loc].total.toFixed(2))]
    worksheet.addRow(totalRow)
    worksheet.getRow(summaryStartRow).font = { bold: true }

    // Average row
    const avgRow = ['Average', ...locations.map(loc => stats[loc].average.toFixed(2))]
    worksheet.addRow(avgRow)
    worksheet.getRow(summaryStartRow + 1).font = { bold: true }

    // Peak row
    const peakRow = ['Peak of Daily Rainfall', ...locations.map(loc => stats[loc].peak.toFixed(2))]
    worksheet.addRow(peakRow)
    worksheet.getRow(summaryStartRow + 2).font = { bold: true }

    // Rain Days row
    const rainDaysRow = ['Rain Days', ...locations.map(loc => stats[loc].rainDays.toFixed(0))]
    worksheet.addRow(rainDaysRow)
    worksheet.getRow(summaryStartRow + 3).font = { bold: true }

    // Wet Days row
    const wetDaysRow = ['Wet Days', ...locations.map(loc => stats[loc].wetDays.toFixed(0))]
    worksheet.addRow(wetDaysRow)
    worksheet.getRow(summaryStartRow + 4).font = { bold: true }

    // Set column widths
    worksheet.getColumn(1).width = 12 // Date column
    for (let i = 2; i <= locations.length + 1; i++) {
      worksheet.getColumn(i).width = 15
      worksheet.getColumn(i).alignment = { horizontal: 'right' }
    }

    // Add borders to all data
    const totalRows = worksheet.lastRow?.number || 1
    for (let row = 1; row <= totalRows; row++) {
      for (let col = 1; col <= locations.length + 1; col++) {
        const cell = worksheet.getCell(row, col)
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Create blob and download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const defaultFilename = `rainfall-pivot-${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, filename || defaultFilename)
    
    return true
  } catch (error) {
    console.error('Error exporting pivot Excel:', error)
    throw new Error('Gagal mengekspor data ke Excel')
  }
}

/**
 * Export rainfall data to Excel file
 */
export const exportRainfallDataToExcel = async (
  data: ExcelExportData[],
  filename?: string
) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data Curah Hujan')

    // Set up columns
    worksheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Curah Hujan (mm)', key: 'rainfall', width: 18 },
      { header: 'Lokasi', key: 'location', width: 25 }
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow({
        date: new Date(row.date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        rainfall: row.rainfall,
        location: row.location
      })
    })

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.key === 'rainfall') {
        // Right align rainfall column
        column.alignment = { horizontal: 'right' }
      }
    })

    // Add borders to all cells with data
    const lastRow = worksheet.lastRow?.number || 1
    const range = worksheet.getCell('A1').address + ':' + worksheet.getCell(`C${lastRow}`).address
    worksheet.getCell(range).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Create blob and download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const defaultFilename = `data-curah-hujan-${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, filename || defaultFilename)
    
    return true
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Gagal mengekspor data ke Excel')
  }
}

/**
 * Export location data to Excel file
 */
export const exportLocationDataToExcel = async (
  data: LocationExportData[],
  filename?: string
) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data Lokasi Stasiun')

    // Set up columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Nama Lokasi', key: 'name', width: 25 },
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Latitude', key: 'latitude', width: 12 },
      { header: 'Longitude', key: 'longitude', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Dibuat', key: 'createdAt', width: 18 }
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description || '-',
        latitude: row.coordinates?.lat || '-',
        longitude: row.coordinates?.lng || '-',
        status: row.status === 'active' ? 'Aktif' : 'Nonaktif',
        createdAt: new Date(row.createdAt).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      })
    })

    // Auto-fit columns and styling
    worksheet.columns.forEach((column) => {
      if (column.key === 'latitude' || column.key === 'longitude') {
        // Right align coordinate columns
        column.alignment = { horizontal: 'right' }
      }
    })

    // Add borders to all cells with data
    const lastRow = worksheet.lastRow?.number || 1
    const range = worksheet.getCell('A1').address + ':' + worksheet.getCell(`H${lastRow}`).address
    worksheet.getCell(range).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Create blob and download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const defaultFilename = `data-lokasi-stasiun-${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, filename || defaultFilename)
    
    return true
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Gagal mengekspor data lokasi ke Excel')
  }
}

/**
 * Export multiple sheets to one Excel file
 */
export const exportMultiSheetExcel = async (
  rainfallData: ExcelExportData[],
  locationData: LocationExportData[],
  filename?: string
) => {
  try {
    const workbook = new ExcelJS.Workbook()
    
    // Add metadata
    workbook.creator = 'Rainfall Management System'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Create rainfall data sheet
    const rainfallSheet = workbook.addWorksheet('Data Curah Hujan')
    rainfallSheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Curah Hujan (mm)', key: 'rainfall', width: 18 },
      { header: 'Lokasi', key: 'location', width: 25 }
    ]

    // Style rainfall sheet header
    rainfallSheet.getRow(1).font = { bold: true }
    rainfallSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add rainfall data
    rainfallData.forEach((row) => {
      rainfallSheet.addRow({
        date: new Date(row.date).toLocaleDateString('id-ID'),
        rainfall: row.rainfall,
        location: row.location
      })
    })

    // Create location data sheet
    const locationSheet = workbook.addWorksheet('Data Lokasi Stasiun')
    locationSheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Nama Lokasi', key: 'name', width: 25 },
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Latitude', key: 'latitude', width: 12 },
      { header: 'Longitude', key: 'longitude', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Dibuat', key: 'createdAt', width: 18 }
    ]

    // Style location sheet header
    locationSheet.getRow(1).font = { bold: true }
    locationSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add location data
    locationData.forEach((row) => {
      locationSheet.addRow({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description || '-',
        latitude: row.coordinates?.lat || '-',
        longitude: row.coordinates?.lng || '-',
        status: row.status === 'active' ? 'Aktif' : 'Nonaktif',
        createdAt: new Date(row.createdAt).toLocaleDateString('id-ID')
      })
    })

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Create blob and download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const defaultFilename = `laporan-lengkap-${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, filename || defaultFilename)
    
    return true
  } catch (error) {
    console.error('Error exporting multi-sheet Excel:', error)
    throw new Error('Gagal mengekspor laporan lengkap ke Excel')
  }
}
