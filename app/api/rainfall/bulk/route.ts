import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { createdResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'
import { parseISODate } from '@/lib/utils/date-helpers'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult.error
    }

    const { user } = authResult

    const contentType = request.headers.get('content-type') || ''

    const rainfallDataToCreate: Array<{
      date: Date;
      rainfall: number;
      locationId: string;
      userId?: string | null;
    }> = []

    // Ambil semua lokasi aktif untuk validasi
    const locations = await prisma.location.findMany({ where: { status: 'ACTIVE' }})
    const locationMapByName = new Map(locations.map(loc => [loc.name, loc.id]))
    const locationIdSet = new Set(locations.map(loc => loc.id))

    if (contentType.includes('application/json')) {
      let payload: unknown

      try {
        payload = await request.json()
      } catch (parseError) {
        return errorResponse('Payload JSON tidak valid', {
          status: 400,
          details: parseError instanceof Error ? parseError.message : 'Unable to parse JSON body'
        })
      }

      const data = (payload as { data?: unknown }).data

      if (!Array.isArray(data)) {
        return errorResponse('Format data tidak valid. Gunakan array data dengan atribut date, rainfall, dan locationId.', {
          status: 400
        })
      }

      data.forEach(item => {
        if (!item || typeof item !== 'object') {
          return
        }

        const { date, rainfall, locationId } = item as { date?: string; rainfall?: number | string; locationId?: string }

        if (!date || !locationId) {
          return
        }

        const parsedDate = parseISODate(date)
        if (!parsedDate) {
          return
        }

        const numericRainfall = typeof rainfall === 'string' ? parseFloat(rainfall.replace(',', '.')) : rainfall

        if (typeof numericRainfall !== 'number' || isNaN(numericRainfall) || numericRainfall < 0) {
          return
        }

        if (!locationIdSet.has(locationId)) {
          return
        }

        rainfallDataToCreate.push({
          date: parsedDate,
          rainfall: numericRainfall,
          locationId,
          userId: user.id
        })
      })

      if (rainfallDataToCreate.length === 0) {
        return errorResponse('Tidak ada data valid yang ditemukan dalam payload JSON', {
          status: 400,
          details: {
            imported: 0,
            totalRows: Array.isArray(data) ? data.length : 0
          }
        })
      }
    } else {
      // Baca FormData
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return errorResponse('File tidak ditemukan', { status: 400 })
      }

      // Proses file CSV
      const fileText = await file.text()
      const lines = fileText.split('\n').map(line => line.trim())
      
      if (lines.length < 2) {
        return errorResponse('File CSV kosong atau tidak valid', { status: 400 })
      }

      // Parse header CSV - cari baris yang dimulai dengan "Date"
      let headerRowIndex = -1;
      let dataStartIndex = -1;
      let csvSeparator = ',';
      let locationHeaderRowIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line || line.trim() === '') {
          continue;
        }
        
        // Deteksi separator - coba comma, tab, semicolon
        let columns = line.split(',');
        let separator = ',';
        
        if (columns.length <= 1) {
          columns = line.split('\t');
          separator = '\t';
        }
        
        if (columns.length <= 1) {
          columns = line.split(';');
          separator = ';';
        }
        
        if (columns.length === 0) {
          continue;
        }
        
        const firstColumn = columns[0].trim().toLowerCase();
        
        if (firstColumn === 'date') {
          headerRowIndex = i;
          csvSeparator = separator;
          
          // Cek format header: standar vs terpisah
          const hasLocationData = columns.slice(1).some(col => col.trim() !== '' && !col.toLowerCase().includes('location'));
          
          if (hasLocationData) {
            dataStartIndex = i + 1;
          } else {
            locationHeaderRowIndex = i + 1;
            dataStartIndex = i + 2;
          }
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        return errorResponse(
          'Tidak ditemukan baris header yang dimulai dengan "Date" dalam file CSV. Pastikan ada kolom "Date" di file CSV.',
          {
            status: 400,
            details: {
              totalLines: lines.length,
              checkedLines: lines.map((line, index) => ({
                lineNumber: index + 1,
                content: line,
                isEmpty: !line || line.trim() === '',
                firstColumn: line ? line.split(',')[0]?.trim() : 'N/A',
                firstColumnSemicolon: line ? line.split(';')[0]?.trim() : 'N/A'
              }))
            }
          }
        )
      }
      
      // Parse headers berdasarkan format yang terdeteksi
      let headers: string[] = []
      
      if (locationHeaderRowIndex !== -1) {
        const locationLine = lines[locationHeaderRowIndex];
        if (!locationLine) {
          return errorResponse('Baris header lokasi tidak ditemukan atau kosong', { status: 400 })
        }
        
        const locationHeaders = locationLine.split(csvSeparator).map(h => h.trim())
        headers = ['Date', ...locationHeaders.slice(1)]
      } else {
        headers = lines[headerRowIndex].split(csvSeparator).map(h => h.trim())
      }

      // Buat mapping kolom lokasi
      const locationColumns: Array<{
        columnIndex: number;
        locationName: string;
      }> = []
      
      for (let i = 1; i < headers.length; i++) {
        const headerName = headers[i].trim()
        if (headerName && headerName !== '') {
          locationColumns.push({
            columnIndex: i,
            locationName: headerName
          })
        }
      }

      // Validasi apakah ada lokasi yang cocok
      const matchedLocations = locationColumns.filter(col => 
        locationMapByName.has(col.locationName)
      )
      
      if (matchedLocations.length === 0) {
        return errorResponse(
          'Tidak ada lokasi di CSV yang cocok dengan database. Periksa nama lokasi di header CSV.',
          {
            status: 400,
            details: {
              csvHeaders: locationColumns.map(l => l.locationName),
              availableLocations: locations.map(l => l.name)
            }
          }
        )
      }

      // Parse data CSV
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line || line.trim() === '') {
          continue;
        }
        
        const values = line.split(csvSeparator).map(v => v.trim())
        
        if (values.length < 2) {
          continue;
        }
        
        const dateValue = values[0]
        
        if (!dateValue || dateValue === '') {
          continue;
        }
        
        // Skip baris summary/total
        if (dateValue.toLowerCase().includes('total') || 
            dateValue.toLowerCase().includes('average') || 
            dateValue.toLowerCase().includes('peak') || 
            dateValue.toLowerCase().includes('rain days') || 
            dateValue.toLowerCase().includes('wet days')) {
          continue;
        }
        
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) {
          continue;
        }
        
        // Parse data untuk setiap lokasi
        locationColumns.forEach(({ columnIndex, locationName }) => {
          if (columnIndex < values.length) {
            const rainfallValue = values[columnIndex]
            const normalizedValue = rainfallValue.replace(',', '.')
            const rainfall = parseFloat(normalizedValue)
            const locationId = locationMapByName.get(locationName)
            
            if (locationId && !isNaN(rainfall) && rainfall >= 0) {
              rainfallDataToCreate.push({
                date,
                rainfall,
                locationId,
                userId: user.id,
              })
            }
          }
        })
      }

      if (rainfallDataToCreate.length === 0) {
        return errorResponse('Tidak ada data valid yang ditemukan dalam file CSV', {
          status: 400,
          details: {
            imported: 0,
            totalRows: 0
          }
        })
      }
    }

    const result = await prisma.rainfallData.createMany({
      data: rainfallDataToCreate,
      skipDuplicates: true,
    })

    const summary = {
      imported: result.count,
      totalRows: rainfallDataToCreate.length,
      skipped: rainfallDataToCreate.length - result.count,
      failed: rainfallDataToCreate.length - result.count
    }

    return createdResponse(summary, {
      message: 'File berhasil diimpor!'
    })

  } catch (error) {
    console.error('Bulk CSV import error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2003') {
        return errorResponse('Foreign key constraint error - User atau Location tidak valid', {
          status: 400,
          details: error instanceof Error ? error.message : 'Database constraint error'
        })
      }
    }

    return errorResponse('Gagal memproses file CSV', {
      status: 500,
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}