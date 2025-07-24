import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Rainfall classification based on Indonesian meteorological standards
export const rainfallCategories = {
  tidakHujan: {
    label: "Tidak Hujan",
    description: "0 mm",
    min: 0,
    max: 0,
    color: "#94a3b8", // gray
    emoji: "☀️"
  },
  ringan: {
    label: "Hujan Ringan",
    description: "0.1 - 20 mm per hari",
    min: 0.1,
    max: 20,
    color: "#22c55e", // green
    emoji: "🌦️"
  },
  sedang: {
    label: "Hujan Sedang", 
    description: "20 - 50 mm per hari",
    min: 20,
    max: 50,
    color: "#f59e0b", // amber
    emoji: "☔"
  },
  lebat: {
    label: "Hujan Lebat",
    description: "lebih dari 50 mm per hari", 
    min: 50,
    max: Infinity,
    color: "#ef4444", // red
    emoji: "🌧️"
  }
} as const

// Function to classify rainfall amount
export const classifyRainfall = (amount: number): keyof typeof rainfallCategories => {
  if (amount === 0) return "tidakHujan"
  if (amount > 0 && amount <= 20) return "ringan"
  if (amount > 20 && amount <= 50) return "sedang"
  return "lebat"
}

// GET /api/analytics/classification - Get rainfall classification data (PUBLIC ACCESS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: {
      location?: { code: string }
      date?: { 
        gte?: Date
        lte?: Date 
      }
    } = {}
    
    if (location && location !== 'all') {
      where.location = { code: location }
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.date = { gte: new Date(startDate) }
    } else if (endDate) {
      where.date = { lte: new Date(endDate) }
    }

    // Get all rainfall data for classification
    const rainfallData = await prisma.rainfallData.findMany({
      where,
      select: {
        id: true,
        date: true,
        rainfall: true,
        location: {
          select: {
            code: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Initialize counts for each category
    const counts = {
      tidakHujan: 0,
      ringan: 0,
      sedang: 0,
      lebat: 0
    }

    // Classify each rainfall record
    rainfallData.forEach(record => {
      const category = classifyRainfall(record.rainfall)
      counts[category]++
    })

    // Convert to chart data format
    const chartData = Object.entries(counts).map(([key, count]) => {
      const category = rainfallCategories[key as keyof typeof rainfallCategories]
      return {
        name: category.label,
        value: count,
        percentage: rainfallData.length > 0 ? parseFloat(((count / rainfallData.length) * 100).toFixed(1)) : 0,
        color: category.color,
        emoji: category.emoji,
        description: category.description,
        category: key
      }
    }).filter(item => item.value > 0) // Only show categories with data

    // Calculate summary statistics
    const totalDays = rainfallData.length
    const totalRainfall = rainfallData.reduce((sum, record) => sum + record.rainfall, 0)
    const averageRainfall = totalDays > 0 ? parseFloat((totalRainfall / totalDays).toFixed(2)) : 0

    // Find the most common category
    const mostCommonCategory = chartData.reduce((max, current) => 
      current.value > max.value ? current : max, 
      chartData[0] || { name: 'Tidak ada data', value: 0 }
    )

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalDays,
          totalRainfall,
          averageRainfall,
          mostCommonCategory: mostCommonCategory?.name || 'Tidak ada data',
          distributionCounts: counts
        },
        filters: {
          location: location || 'all',
          startDate,
          endDate,
          appliedFilters: {
            hasLocationFilter: !!location && location !== 'all',
            hasDateFilter: !!(startDate || endDate)
          }
        }
      }
    })

  } catch (error) {
    console.error('Error in /api/analytics/classification:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch rainfall classification data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    )
  }
}
