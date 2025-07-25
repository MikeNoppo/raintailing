import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - User session not found' },
        { status: 401 }
      )
    }

    // Validasi apakah user ada di database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan di database' },
        { status: 400 }
      )
    }

    // Baca FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Proses file CSV
    const fileText = await file.text()
    const lines = fileText.split('\n').map(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'File CSV kosong atau tidak valid' },
        { status: 400 }
      )
    }

    const rainfallDataToCreate: Array<{
      date: Date;
      rainfall: number;
      locationId: string;
      userId?: string | null;
    }> = []

    // Ambil semua lokasi aktif untuk validasi
    const locations = await prisma.location.findMany({ where: { status: 'ACTIVE' }})
    const locationMap = new Map(locations.map(loc => [loc.name, loc.id]))

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
      return NextResponse.json({
        success: false,
        error: `Tidak ditemukan baris header yang dimulai dengan "Date" dalam file CSV. Pastikan ada kolom "Date" di file CSV.`,
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
      }, { status: 400 })
    }
    
    // Parse headers berdasarkan format yang terdeteksi
    let headers: string[] = []
    
    if (locationHeaderRowIndex !== -1) {
      const locationLine = lines[locationHeaderRowIndex];
      if (!locationLine) {
        return NextResponse.json({
          success: false,
          error: 'Baris header lokasi tidak ditemukan atau kosong'
        }, { status: 400 })
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
      locationMap.has(col.locationName)
    )
    
    if (matchedLocations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada lokasi di CSV yang cocok dengan database. Periksa nama lokasi di header CSV.',
        details: {
          csvHeaders: locationColumns.map(l => l.locationName),
          availableLocations: locations.map(l => l.name)
        }
      }, { status: 400 })
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
          const locationId = locationMap.get(locationName)
          
          if (locationId && !isNaN(rainfall) && rainfall >= 0) {
            rainfallDataToCreate.push({
              date,
              rainfall,
              locationId,
              userId: session.user.id,
            })
          }
        }
      })
    }

    // Simpan data ke database
    if (rainfallDataToCreate.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada data valid yang ditemukan dalam file CSV',
        imported: 0,
        totalRows: 0,
      }, { status: 400 })
    }

    const result = await prisma.rainfallData.createMany({
      data: rainfallDataToCreate,
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      message: 'File berhasil diimpor!',
      imported: result.count,
      totalRows: rainfallDataToCreate.length,
      skipped: rainfallDataToCreate.length - result.count,
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk CSV import error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Foreign key constraint error - User atau Location tidak valid',
            details: error instanceof Error ? error.message : 'Database constraint error'
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Gagal memproses file CSV',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}