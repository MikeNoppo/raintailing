import { NextRequest } from 'next/server'

import { successResponse, errorResponse } from '@/lib/api/responses'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    const where: {
      location?: { code: string }
    } = {}
    
    if (location && location !== 'all') {
      where.location = { code: location }
    }

    const [minMaxDates, availableDates] = await Promise.all([
      prisma.rainfallData.aggregate({
        where,
        _min: { date: true },
        _max: { date: true },
        _count: { id: true }
      }),
      prisma.rainfallData.groupBy({
        by: ['date'],
        where,
        _count: { id: true },
        orderBy: { date: 'desc' }
      })
    ])

    if (!minMaxDates._min.date || !minMaxDates._max.date) {
      return successResponse({
        latestDate: null,
        earliestDate: null,
        latestMonth: null,
        earliestMonth: null,
        totalRecords: 0,
        months: []
      })
    }

    const latestDate = minMaxDates._max.date
    const earliestDate = minMaxDates._min.date
    
    const latestDateObj = new Date(latestDate)
    const earliestDateObj = new Date(earliestDate)
    
    const latestMonth = `${latestDateObj.getFullYear()}-${String(latestDateObj.getMonth() + 1).padStart(2, '0')}`
    const earliestMonth = `${earliestDateObj.getFullYear()}-${String(earliestDateObj.getMonth() + 1).padStart(2, '0')}`

    const monthYearMap = new Map<string, { year: number, month: number, count: number }>()

    availableDates.forEach(item => {
      const date = new Date(item.date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
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

    const months = Array.from(monthYearMap.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year
      }
      return b.month - a.month
    })

    return successResponse({
      latestDate: latestDate.toISOString().split('T')[0],
      earliestDate: earliestDate.toISOString().split('T')[0],
      latestMonth,
      earliestMonth,
      totalRecords: minMaxDates._count.id,
      months
    })

  } catch (error) {
    console.error('Get available dates error:', error)
    return errorResponse('Internal server error')
  }
}
