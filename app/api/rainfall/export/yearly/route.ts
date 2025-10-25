import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const location = searchParams.get('location')

    if (!year) {
      return NextResponse.json(
        { error: 'Year parameter is required' },
        { status: 400 }
      )
    }

    const yearNum = parseInt(year)

    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      )
    }

    const startDate = new Date(yearNum, 0, 1)
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59)

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

    const workbook = new ExcelJS.Workbook()
    const locations = [...new Set(data.map(d => d.location.code))].sort()
    const locationNames: { [key: string]: string } = {}
    data.forEach(d => {
      locationNames[d.location.code] = d.location.name
    })

    const monthlyStats: {
      [month: number]: {
        [locationCode: string]: {
          total: number
          values: number[]
          peak: number
        }
      }
    } = {}

    for (let m = 0; m < 12; m++) {
      monthlyStats[m + 1] = {}
      locations.forEach(loc => {
        monthlyStats[m + 1][loc] = {
          total: 0,
          values: [],
          peak: 0
        }
      })
    }

    data.forEach(item => {
      const month = item.date.getMonth() + 1
      const locCode = item.location.code
      
      if (monthlyStats[month] && monthlyStats[month][locCode]) {
        monthlyStats[month][locCode].total += item.rainfall
        monthlyStats[month][locCode].values.push(item.rainfall)
        if (item.rainfall > monthlyStats[month][locCode].peak) {
          monthlyStats[month][locCode].peak = item.rainfall
        }
      }
    })

    const summarySheet = workbook.addWorksheet('Ringkasan Tahunan')

    summarySheet.addRow([`Laporan Curah Hujan Tahunan ${yearNum}`])
    const titleRow = summarySheet.getRow(1)
    titleRow.font = { bold: true, size: 16 }
    titleRow.alignment = { horizontal: 'center' }
    summarySheet.mergeCells(1, 1, 1, locations.length + 1)
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }

    summarySheet.addRow([])

    const headers = ['Bulan', ...locations.map(code => `${locationNames[code]} (${code})`)]
    summarySheet.addRow(headers)
    const headerRow = summarySheet.getRow(3)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    headerRow.alignment = { horizontal: 'center' }

    for (let m = 1; m <= 12; m++) {
      const row: (string | number)[] = [MONTH_NAMES[m - 1]]
      
      locations.forEach(locCode => {
        const stats = monthlyStats[m][locCode]
        row.push(stats.total || 0)
      })
      
      summarySheet.addRow(row)
    }

    summarySheet.addRow([])
    
    const yearlyTotals: (string | number)[] = ['TOTAL TAHUNAN']
    const yearlyAverages: (string | number)[] = ['RATA-RATA BULANAN']
    const yearlyPeaks: (string | number)[] = ['CURAH HUJAN TERTINGGI']
    
    locations.forEach(locCode => {
      let yearlyTotal = 0
      let yearlyPeak = 0
      let monthCount = 0
      
      for (let m = 1; m <= 12; m++) {
        const stats = monthlyStats[m][locCode]
        yearlyTotal += stats.total
        if (stats.peak > yearlyPeak) {
          yearlyPeak = stats.peak
        }
        if (stats.values.length > 0) {
          monthCount++
        }
      }
      
      yearlyTotals.push(yearlyTotal)
      yearlyAverages.push(monthCount > 0 ? yearlyTotal / monthCount : 0)
      yearlyPeaks.push(yearlyPeak)
    })
    
    summarySheet.addRow(yearlyTotals)
    const totalRow = summarySheet.lastRow!
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD700' }
    }
    
    summarySheet.addRow(yearlyAverages)
    const avgRow = summarySheet.lastRow!
    avgRow.font = { bold: true }
    avgRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF90EE90' }
    }
    
    summarySheet.addRow(yearlyPeaks)
    const peakRow = summarySheet.lastRow!
    peakRow.font = { bold: true }
    peakRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    }

    summarySheet.getColumn(1).width = 20
    for (let i = 2; i <= locations.length + 1; i++) {
      summarySheet.getColumn(i).width = 18
      summarySheet.getColumn(i).alignment = { horizontal: 'center' }
    }

    for (let row = 3; row <= summarySheet.lastRow!.number; row++) {
      for (let col = 1; col <= locations.length + 1; col++) {
        const cell = summarySheet.getCell(row, col)
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    }

    summarySheet.addRow([])
    summarySheet.addRow(['CATATAN:'])
    const notesTitle = summarySheet.getRow(summarySheet.lastRow!.number)
    notesTitle.font = { bold: true }
    
    summarySheet.addRow(['• Total Tahunan: Jumlah curah hujan selama 1 tahun'])
    summarySheet.addRow(['• Rata-rata Bulanan: Rata-rata curah hujan per bulan'])
    summarySheet.addRow(['• Curah Hujan Tertinggi: Nilai maksimum dalam 1 tahun'])
    summarySheet.addRow([`• Periode data: Tahun ${yearNum}`])
    summarySheet.addRow([`• Tanggal export: ${new Date().toLocaleDateString('id-ID')}`])

    for (let m = 1; m <= 12; m++) {
      const monthData = data.filter(d => d.date.getMonth() + 1 === m)
      
      if (monthData.length === 0) continue

      const monthSheet = workbook.addWorksheet(`${MONTH_NAMES[m - 1]} ${yearNum}`)

      const dates = [...new Set(monthData.map(d => d.date.toISOString().split('T')[0]))].sort()
      const pivotData: { [date: string]: { [locationCode: string]: number } } = {}
      
      monthData.forEach(item => {
        const dateStr = item.date.toISOString().split('T')[0]
        if (!pivotData[dateStr]) {
          pivotData[dateStr] = {}
        }
        pivotData[dateStr][item.location.code] = item.rainfall
      })

      monthSheet.addRow([`Detail Harian - ${MONTH_NAMES[m - 1]} ${yearNum}`])
      const monthTitleRow = monthSheet.getRow(1)
      monthTitleRow.font = { bold: true, size: 14 }
      monthTitleRow.alignment = { horizontal: 'center' }
      monthSheet.mergeCells(1, 1, 1, locations.length + 1)

      monthSheet.addRow([])

      const monthHeaders = ['Tanggal', ...locations.map(code => `${locationNames[code]} (${code})`)]
      monthSheet.addRow(monthHeaders)
      const monthHeaderRow = monthSheet.getRow(3)
      monthHeaderRow.font = { bold: true }
      monthHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      }

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
        
        monthSheet.addRow(row)
      })

      monthSheet.addRow([])
      const monthSummaryStart = monthSheet.lastRow!.number + 1

      const monthTotals: (string | number)[] = [`Total ${MONTH_NAMES[m - 1]} (mm)`]
      const monthAvgs: (string | number)[] = ['Rata-rata per Hari (mm)']
      const monthPeaks: (string | number)[] = ['Tertinggi (mm)']
      
      locations.forEach(locCode => {
        const stats = monthlyStats[m][locCode]
        monthTotals.push(stats.total.toFixed(1))
        monthAvgs.push(stats.values.length > 0 ? (stats.total / stats.values.length).toFixed(2) : '0.00')
        monthPeaks.push(stats.peak.toFixed(1))
      })
      
      monthSheet.addRow(monthTotals)
      monthSheet.getRow(monthSummaryStart).font = { bold: true }
      monthSheet.getRow(monthSummaryStart).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }
      }
      
      monthSheet.addRow(monthAvgs)
      monthSheet.getRow(monthSummaryStart + 1).font = { bold: true }
      
      monthSheet.addRow(monthPeaks)
      monthSheet.getRow(monthSummaryStart + 2).font = { bold: true }

      monthSheet.getColumn(1).width = 20
      for (let i = 2; i <= locations.length + 1; i++) {
        monthSheet.getColumn(i).width = 18
        monthSheet.getColumn(i).alignment = { horizontal: 'center' }
      }

      for (let row = 3; row <= monthSummaryStart + 2; row++) {
        for (let col = 1; col <= locations.length + 1; col++) {
          const cell = monthSheet.getCell(row, col)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    const locationFilter = location && location !== 'all' ? `_${location}` : ''
    const filename = `Laporan_Tahunan_${yearNum}${locationFilter}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Export yearly data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
