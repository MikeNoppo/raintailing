import { NextRequest } from 'next/server'

import { successResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'

// GET /api/rainfall/available-dates - Get available year/month combinations (PUBLIC ACCESS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    // Build where clause
    const where: {
      location?: { code: string }
    } = {}
    
    if (location && location !== 'all') {
      where.location = { code: location }
    }

    // Get available year/month combinations with count
    const availableDates = await prisma.rainfallData.groupBy({
      by: ['date'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Process the data to extract year/month combinations
    const monthYearMap = new Map<string, { year: number, month: number, count: number }>()

    availableDates.forEach(item => {
      const date = new Date(item.date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // JavaScript months are 0-indexed
      const key = `${year}-${month.toString().padStart(2, '0')}`
      
      if (monthYearMap.has(key)) {
        const existing = monthYearMap.get(key)!
        monthYearMap.set(key, {
          ...existing,
          count: existing.count + item._count.id
        })
      } else {
        monthYearMap.set(key, {
          year,
          month,
          count: item._count.id
        })
      }
    })

    // Convert map to array and sort by year desc, month desc
    const months = Array.from(monthYearMap.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year // Year descending
      }
      return b.month - a.month // Month descending
    })

    return successResponse({
      months,
      total: availableDates.length
    })

  } catch (error) {
    console.error('Get available dates error:', error)
    return errorResponse('Internal server error')
  }
}
