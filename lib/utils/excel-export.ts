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

export interface MonthlyExportData {
  date: string
  rainfall: number
  location: string
  locationCode: string
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
    const stats: { [location: string]: {
      total: number;
      average: number;
      peak: number;
      rainDays: number;
      wetDays: number;
    } } = {}
    
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

/**
 * Export monthly rainfall data with comprehensive statistics
 */
export const exportMonthlyRainfallToExcel = async (
  data: MonthlyExportData[],
  year: number,
  month: number,
  filename?: string
) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Monthly Rainfall Report')

    // Get month name in Indonesian
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const monthName = monthNames[month - 1]

    // Get unique locations and sort by location code
    const locations = [...new Set(data.map(d => d.locationCode))].sort()
    const locationNames: { [key: string]: string } = {}
    data.forEach(d => {
      locationNames[d.locationCode] = d.location
    })

    // Get unique dates and sort
    const dates = [...new Set(data.map(d => d.date))].sort()

    // Create pivot data structure
    const pivotData: { [date: string]: { [locationCode: string]: number } } = {}
    
    data.forEach(item => {
      if (!pivotData[item.date]) {
        pivotData[item.date] = {}
      }
      pivotData[item.date][item.locationCode] = item.rainfall
    })

    // Add title
    worksheet.addRow([`Laporan Curah Hujan ${monthName} ${year}`])
    const titleRow = worksheet.getRow(1)
    titleRow.font = { bold: true, size: 16 }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(1, 1, 1, locations.length + 1)

    // Add empty row
    worksheet.addRow([])

    // Set up data table headers
    const headers = ['Tanggal', ...locations.map(code => `${locationNames[code]} (${code})`)]
    worksheet.addRow(headers)

    // Style the header row
    const headerRow = worksheet.getRow(3)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    headerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }

    // Add data rows
    dates.forEach(date => {
      const row: (string | number)[] = [
        new Date(date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      ]
      
      locations.forEach(locationCode => {
        row.push(pivotData[date]?.[locationCode] || 0)
      })
      
      worksheet.addRow(row)
    })

    // Calculate statistics
    const stats: { [locationCode: string]: {
      total: number;
      average: number;
      peak: number;
      rainDays: number;
      wetDays: number;
    } } = {}
    
    locations.forEach(locationCode => {
      const locationData = data.filter(d => d.locationCode === locationCode)
      const rainfallValues = locationData.map(d => d.rainfall)
      
      stats[locationCode] = {
        total: rainfallValues.reduce((sum, r) => sum + r, 0),
        average: rainfallValues.length > 0 ? rainfallValues.reduce((sum, r) => sum + r, 0) / rainfallValues.length : 0,
        peak: rainfallValues.length > 0 ? Math.max(...rainfallValues) : 0,
        rainDays: rainfallValues.filter(r => r > 0).length,
        wetDays: rainfallValues.filter(r => r >= 1).length
      }
    })

    // Add empty row before statistics
    worksheet.addRow([])
    const summaryStartRow = (worksheet.lastRow?.number || 0) + 1

    // Statistics section title
    worksheet.addRow(['STATISTIK BULANAN'])
    const statsTitle = worksheet.getRow(summaryStartRow)
    statsTitle.font = { bold: true, size: 14 }
    statsTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B35' }
    }
    worksheet.mergeCells(summaryStartRow, 1, summaryStartRow, locations.length + 1)

    // Total row
    const totalRow = [`Total ${monthName} ${year} (mm)`, ...locations.map(code => stats[code].total.toFixed(1))]
    worksheet.addRow(totalRow)
    const totalRowNum = worksheet.lastRow?.number || 0
    worksheet.getRow(totalRowNum).font = { bold: true }
    worksheet.getRow(totalRowNum).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBF9000' }
    }

    // Average row
    const avgRow = ['Rata-rata per Hari (mm)', ...locations.map(code => stats[code].average.toFixed(2))]
    worksheet.addRow(avgRow)
    const avgRowNum = worksheet.lastRow?.number || 0
    worksheet.getRow(avgRowNum).font = { bold: true }
    worksheet.getRow(avgRowNum).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }

    // Peak row
    const peakRow = ['Curah Hujan Harian Tertinggi (mm)', ...locations.map(code => stats[code].peak.toFixed(1))]
    worksheet.addRow(peakRow)
    const peakRowNum = worksheet.lastRow?.number || 0
    worksheet.getRow(peakRowNum).font = { bold: true }
    worksheet.getRow(peakRowNum).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF0000' }
    }

    // Rain Days row
    const rainDaysRow = ['Hari Hujan (hari)', ...locations.map(code => stats[code].rainDays.toString())]
    worksheet.addRow(rainDaysRow)
    const rainDaysRowNum = worksheet.lastRow?.number || 0
    worksheet.getRow(rainDaysRowNum).font = { bold: true }
    worksheet.getRow(rainDaysRowNum).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5B9BD5' }
    }

    // Wet Days row
    const wetDaysRow = ['Hari Basah ≥1mm (hari)', ...locations.map(code => stats[code].wetDays.toString())]
    worksheet.addRow(wetDaysRow)
    const wetDaysRowNum = worksheet.lastRow?.number || 0
    worksheet.getRow(wetDaysRowNum).font = { bold: true }
    worksheet.getRow(wetDaysRowNum).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00B0F0' }
    }

    // Set column widths
    worksheet.getColumn(1).width = 20 // Date/Statistics column
    for (let i = 2; i <= locations.length + 1; i++) {
      worksheet.getColumn(i).width = 18
      worksheet.getColumn(i).alignment = { horizontal: 'center' }
    }

    // Add borders to all cells
    const totalRows = worksheet.lastRow?.number || 1
    for (let row = 3; row <= totalRows; row++) {
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

    // Add notes section
    worksheet.addRow([])
    worksheet.addRow(['CATATAN:'])
    const notesTitle = worksheet.getRow(worksheet.lastRow?.number || 0)
    notesTitle.font = { bold: true }
    
    worksheet.addRow(['• Hari Hujan: Hari dengan curah hujan > 0 mm'])
    worksheet.addRow(['• Hari Basah: Hari dengan curah hujan ≥ 1 mm'])
    worksheet.addRow([`• Data periode: ${monthName} ${year}`])
    worksheet.addRow([`• Tanggal export: ${new Date().toLocaleDateString('id-ID')}`])

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Create blob and download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const defaultFilename = `laporan-curah-hujan-${monthName.toLowerCase()}-${year}.xlsx`
    saveAs(blob, filename || defaultFilename)
    
    return true
  } catch (error) {
    console.error('Error exporting monthly Excel:', error)
    throw new Error('Gagal mengekspor laporan bulanan ke Excel')
  }
}
