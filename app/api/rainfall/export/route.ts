import { NextRequest, NextResponse } from 'next/server'
import * as ExcelJS from 'exceljs'

import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from '@/lib/utils/date-helpers'

// GET /api/rainfall/export - Export rainfall data for specific month/year (PUBLIC ACCESS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const location = searchParams.get('location')

    // Validate required parameters
    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month parameters are required' },
        { status: 400 }
      )
    }

    const yearNum = parseInt(year)
    const monthNum = parseInt(month)

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month parameter' },
        { status: 400 }
      )
    }

    // Build date range for the selected month
    const startDate = startOfMonth(yearNum, monthNum)
    const endDate = endOfMonth(yearNum, monthNum)

    // Build where clause
    const where: {
      location?: { code: string }
      date: {
        gte: Date
        lte: Date
      }
    } = {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
    
    if (location && location !== 'all') {
      where.location = { code: location }
    }

    // Get rainfall data for the specified period
    const data = await prisma.rainfallData.findMany({
      where,
      include: {
        location: {
          select: {
            code: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified period' },
        { status: 404 }
      )
    }

    // Generate Excel file with enhanced template
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Monthly Rainfall Report')

    // Get month name in Indonesian
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const monthName = monthNames[monthNum - 1]

    // Get unique locations and sort by location code
    const locations = [...new Set(data.map(d => d.location.code))].sort()
    const locationNames: { [key: string]: string } = {}
    data.forEach(d => {
      locationNames[d.location.code] = d.location.name
    })

    // Get unique dates and sort
    const dates = [...new Set(data.map(d => d.date.toISOString().split('T')[0]))].sort()

    // Create pivot data structure
    const pivotData: { [date: string]: { [locationCode: string]: number } } = {}
    
    data.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0]
      if (!pivotData[dateStr]) {
        pivotData[dateStr] = {}
      }
      pivotData[dateStr][item.location.code] = item.rainfall
    })

    // Add title
    worksheet.addRow([`Laporan Curah Hujan ${monthName} ${yearNum}`])
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
      const locationData = data.filter(d => d.location.code === locationCode)
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
    const totalRow = [`Total ${monthName} ${yearNum} (mm)`, ...locations.map(code => stats[code].total.toFixed(1))]
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
    worksheet.addRow([`• Data periode: ${monthName} ${yearNum}`])
    worksheet.addRow([`• Tanggal export: ${new Date().toLocaleDateString('id-ID')}`])

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Create filename
    const locationFilter = location && location !== 'all' ? `_${location}` : ''
    const filename = `Laporan_Curah_Hujan_${monthName}_${yearNum}${locationFilter}.xlsx`

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Export rainfall data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
