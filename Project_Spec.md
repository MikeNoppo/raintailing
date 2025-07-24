# 📋 PROJECT SPECIFICATION - RAINTAILING DASHBOARD

## 🎯 Overview
**Raintailing** adalah aplikasi web dashboard untuk monitoring dan manajemen data curah hujan di berbagai lokasi stasiun pengukuran. Aplikasi ini dibangun dengan Next.js 15, menggunakan PostgreSQL dengan Prisma ORM, dan NextAuth untuk autentikasi.

## 🏗️ Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui, Lucide Icons
- **Charts**: Chart.js, Recharts
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL dengan Prisma ORM
- **Authentication**: NextAuth.js dengan Credentials Provider
- **File Processing**: ExcelJS untuk import/export Excel
- **Styling**: Tailwind CSS dengan animasi

## 🗂️ Struktur Aplikasi

### 🔐 Authentication System
- **Roles**: ADMIN, OPERATOR, VIEWER
- **Features**: Username/password login, session management, role-based access
- **Pages**: `/login` dengan redirect ke dashboard

### 📊 Dashboard Features
1. **Real-time Monitoring**
   - Grafik curah hujan harian (Line Chart)
   - Chart perbandingan lokasi (Bar Chart)
   - Area chart untuk trend
   - Klasifikasi intensitas hujan (Pie/Donut Chart)

2. **Data Analytics**
   - Statistik per lokasi
   - Kategori hujan (Ringan, Sedang, Lebat, Tidak Hujan)
   - Analisis bulanan dan trend
   - Export data ke Excel

3. **Admin Panel**
   - Input data manual
   - Upload Excel batch import
   - Manajemen lokasi stasiun
   - User management

### 📍 Location Management
**Lokasi Stasiun yang ada:**
- GSW-PIT (Gosowong Pit)
- GSW-DP3 (Gosowong Helipad DP3)
- TSF (Tailing Storage Facility)
- KNC-PRT (Kencana Portal)
- TGR-PRT (Toguraci Portal)
- GSW-NTH (Gosowong North)

## 🔌 API ENDPOINTS YANG TERSEDIA

### 🔐 Authentication APIs
```
POST /api/auth/[...nextauth]      # NextAuth handler
POST /api/auth/register           # Register user baru
```

### 👤 User Management APIs
```
GET  /api/user                    # Get user profile
PATCH /api/user                   # Update user profile
```

### 📍 Location Management APIs ✅ **COMPLETED**
```typescript
// /api/locations
GET    /api/locations             # Get all locations
POST   /api/locations             # Create new location
PATCH  /api/locations/[id]        # Update location
DELETE /api/locations/[id]        # Delete location
PATCH  /api/locations/[id]/status # Toggle location status
```

**✨ Status Implementasi:**
- ✅ API Routes: `/api/locations` - **SELESAI**
- ✅ Custom Hooks: `useLocations`, `useLocationMutations` - **SELESAI**
- ✅ UI Components: `LocationManagement` - **SELESAI & TERINTEGRASI**
- ✅ Filter Integration: `FilterControls` - **SELESAI & TERINTEGRASI**
- ✅ Database Seed: Default locations - **SELESAI**
- ✅ Type Definitions: Updated types - **SELESAI**

**🔧 Features yang sudah berfungsi:**
- CRUD operations untuk location management
- Real-time filtering berdasarkan status lokasi
- Role-based access control (ADMIN/OPERATOR untuk CUD, semua role untuk Read)
- Validasi duplicate location codes
- Auto-refresh data dengan loading states
- Error handling dan user feedback via toast notifications
- Soft delete protection untuk locations dengan data terkait

## 📋 PLANNING INTEGRASI DATABASE

### Phase 1: Core API Development (Priority Tinggi)

#### 1.1 Location Management APIs ✅ **COMPLETED**
```typescript
// /api/locations - SUDAH DIIMPLEMENTASI
GET    /api/locations             # Get all locations ✅
POST   /api/locations             # Create new location ✅
PATCH  /api/locations/[id]        # Update location ✅
DELETE /api/locations/[id]        # Delete location ✅
PATCH  /api/locations/[id]/status # Toggle location status ✅
```

#### 1.2 Rainfall Data APIs
```typescript
// /api/rainfall
GET    /api/rainfall              # Get rainfall data with filters
POST   /api/rainfall              # Add single rainfall data
POST   /api/rainfall/bulk         # Bulk import from Excel
DELETE /api/rainfall/[id]         # Delete rainfall data
PUT    /api/rainfall/[id]         # Update rainfall data

// Query Parameters for GET /api/rainfall:
// ?location=GSW-PIT&startDate=2025-06-01&endDate=2025-06-30
// ?page=1&limit=50&sortBy=date&order=desc
```

#### 1.3 Analytics & Statistics APIs
```typescript
// /api/analytics
GET /api/analytics/summary        # Overall statistics
GET /api/analytics/by-location    # Statistics per location
GET /api/analytics/monthly        # Monthly aggregates
GET /api/analytics/trends         # Rainfall trends
GET /api/analytics/classification # Rainfall classification data
```

#### 1.4 File Management APIs
```typescript
// /api/files
POST /api/files/upload           # Upload Excel file
GET  /api/files/export           # Export data to Excel
GET  /api/files/template         # Download Excel template
```

### Phase 2: Advanced Features (Priority Sedang)

#### 2.1 User Management APIs (Admin)
```typescript
// /api/admin/users
GET    /api/admin/users          # Get all users (Admin only)
POST   /api/admin/users          # Create user (Admin only)
PUT    /api/admin/users/[id]     # Update user (Admin only)
DELETE /api/admin/users/[id]     # Delete user (Admin only)
PATCH  /api/admin/users/[id]/role # Change user role (Admin only)
```

#### 2.2 Audit & Logging APIs
```typescript
// /api/audit
GET /api/audit/logs              # Get audit logs (Admin only)
GET /api/audit/user-activity     # Get user activity logs
```

#### 2.3 System Configuration APIs
```typescript
// /api/config
GET  /api/config                 # Get system configurations
PUT  /api/config                 # Update configurations (Admin only)
```

### Phase 3: Data Migration & Integration Steps

#### 3.1 Database Setup
```bash
# 1. Setup Prisma dan generate client
npx prisma generate
npx prisma db push

# 2. Seed initial data
npx prisma db seed
```

#### 3.2 Data Migration Strategy
1. **Migrate Mock Data**: Convert rainfall-data.ts ke database
2. **Location Setup**: Migrate location data dari localStorage ke database
3. **User Setup**: Create initial admin user

#### 3.3 Component Integration Plan

**High Priority - Mengganti Mock Data:**
1. rainfall-bar-chart.tsx - Ganti `dailyData` dengan API call
2. rainfall-chart.tsx - Integrasi dengan real-time data
3. rainfall-classification-chart.tsx - Dynamic data dari API
4. rainfall-analytics-dashboard.tsx - Real-time analytics
5. ✅ filter-controls.tsx - Dynamic location dari database **SELESAI**

**Medium Priority - Admin Features:**
1. ✅ location-management.tsx - CRUD operations ke database **SELESAI**
2. admin-panel.tsx - File upload dan manual input
3. data-table.tsx - Pagination dan search

### Phase 4: Implementation Details

#### 4.1 API Route Structure
```typescript
// Example: /api/rainfall/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const data = await prisma.rainfallData.findMany({
      where: {
        ...(location && { location: { code: location } }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      include: {
        location: true,
        user: { select: { username: true } }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

#### 4.2 Component Integration Example
```typescript
// Hook untuk data fetching
export function useRainfallData(filters: FilterOptions) {
  return useSWR(
    `/api/rainfall?${new URLSearchParams(filters as any)}`,
    fetcher,
    { refreshInterval: 30000 } // Refresh setiap 30 detik
  )
}

// Component update
export function RainfallChart({ filters }: { filters: FilterOptions }) {
  const { data, error, isLoading } = useRainfallData(filters)
  
  if (isLoading) return <ChartSkeleton />
  if (error) return <ErrorMessage />
  
  return <Chart data={data} />
}
```

### Phase 5: File Upload & Excel Integration

#### 5.1 Excel Import API
```typescript
// /api/rainfall/import/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Process Excel file dengan ExcelJS
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  
  // Validate dan insert data
  // Return hasil import
}
```

#### 5.2 Data Validation
- Validasi format tanggal
- Validasi lokasi stasiun
- Validasi nilai curah hujan (>= 0)
- Duplicate detection

## 🗄️ Database Schema Priority

**Core Tables (Phase 1):**
- ✅ `User` - **SELESAI** (Sudah ada)
- ✅ `Location` - **SELESAI & TERIMPLEMENTASI**
- ⚠️ `RainfallData` - **Perlu diimplementasi**

**Supporting Tables (Phase 2):**
- `MonthlyAggregate` 
- `FileUpload`
- `AuditLog`

**Future Tables (Phase 3):**
- `RainfallThreshold`
- `SystemConfig`

## 🎯 Next Steps - Implementation Order

1. ✅ **Week 1**: Setup database & Location API - **SELESAI**
2. **Week 2**: Rainfall Data API & basic CRUD - **NEXT PRIORITY**
3. **Week 3**: Analytics API & Chart integration
4. **Week 4**: File upload & Excel import/export
5. **Week 5**: Testing & optimization

**📋 Current Progress Summary:**
- ✅ **Location Management System** - Fully implemented with API, hooks, and UI
- ✅ **Database Schema** - All models ready and seeded
- ✅ **Authentication System** - NextAuth with role-based access
- 🎯 **Next Target**: Rainfall Data API implementation

## 📊 Performance Considerations

- **Caching**: Implement Redis untuk analytics data
- **Pagination**: Untuk large datasets
- **Indexing**: Database indexes pada date, location
- **Real-time**: Consider WebSocket untuk live updates
- **File Processing**: Background jobs untuk large Excel files