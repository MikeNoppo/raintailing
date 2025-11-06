"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Plus, Edit2, Trash2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useLocations, useLocationMutations, type Location, type CreateLocationData, type UpdateLocationData } from "@/lib/hooks/useLocations"
import { LocationStatus } from "@prisma/client"

export function LocationManagement() {
  const { locations, loading, error, refetch } = useLocations({ includeInactive: true })
  const { createLocation, updateLocation, updateLocationStatus, deleteLocation, loading: mutationLoading } = useLocationMutations()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    coordinates: ""
  })

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      coordinates: ""
    })
    setEditingLocation(null)
  }

  const parseCoordinates = (coordStr: string): { latitude?: number; longitude?: number } => {
    if (!coordStr.trim()) return {}

    try {
      const parts = coordStr.split(',').map(s => s.trim())
      if (parts.length !== 2) return {}

      const parseDMS = (dmsStr: string): number | null => {
        const dmsPattern = /(\d+)°\s*(\d+)?'?\s*(\d+(?:\.\d+)?)?"?\s*(LS|LU|BT|BB|S|N|E|W)?/i
        const match = dmsStr.match(dmsPattern)
        
        if (!match) {
          const decimalMatch = dmsStr.match(/-?\d+\.?\d*/)
          return decimalMatch ? parseFloat(decimalMatch[0]) : null
        }

        const degrees = parseInt(match[1])
        const minutes = match[2] ? parseInt(match[2]) : 0
        const seconds = match[3] ? parseFloat(match[3]) : 0
        const direction = match[4]?.toUpperCase()

        let decimal = degrees + minutes / 60 + seconds / 3600

        if (direction === 'LS' || direction === 'S' || direction === 'BB' || direction === 'W') {
          decimal = -decimal
        }

        return decimal
      }

      const lat = parseDMS(parts[0])
      const lon = parseDMS(parts[1])

      return {
        latitude: lat !== null ? lat : undefined,
        longitude: lon !== null ? lon : undefined
      }
    } catch {
      return {}
    }
  }

  const formatCoordinates = (lat: number | null, lon: number | null): string => {
    if (lat === null || lon === null) return ""
    
    const formatDMS = (decimal: number, isLatitude: boolean): string => {
      const absolute = Math.abs(decimal)
      const degrees = Math.floor(absolute)
      const minutesDecimal = (absolute - degrees) * 60
      const minutes = Math.floor(minutesDecimal)
      const seconds = ((minutesDecimal - minutes) * 60).toFixed(2)
      
      let direction = ""
      if (isLatitude) {
        direction = decimal >= 0 ? "LU" : "LS"
      } else {
        direction = decimal >= 0 ? "BT" : "BB"
      }
      
      return `${degrees}°${minutes}'${seconds}" ${direction}`
    }

    return `${formatDMS(lat, true)}, ${formatDMS(lon, false)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Nama dan kode lokasi wajib diisi")
      return
    }

    try {
      const coords = parseCoordinates(formData.coordinates)
      
      const locationData: CreateLocationData | UpdateLocationData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }

      if (editingLocation) {
        await updateLocation(editingLocation.id, locationData)
        toast.success("Lokasi berhasil diperbarui")
      } else {
        await createLocation(locationData as CreateLocationData)
        toast.success("Lokasi baru berhasil ditambahkan")
      }

      setIsDialogOpen(false)
      resetForm()
      refetch()
    } catch {
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      code: location.code,
      description: location.description || "",
      coordinates: formatCoordinates(location.latitude, location.longitude)
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (locationId: string, locationName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus lokasi "${locationName}"?`)) {
      try {
        await deleteLocation(locationId)
        toast.success("Lokasi berhasil dihapus")
        refetch()
      } catch {
        // Error handling sudah ada di hook
      }
    }
  }

  const handleStatusToggle = async (locationId: string, currentStatus: LocationStatus) => {
    try {
      const newStatus: LocationStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await updateLocationStatus(locationId, newStatus)
      toast.success("Status lokasi berhasil diubah")
      refetch()
    } catch {
      // Error handling sudah ada di hook
    }
  }

  const getStatusBadge = (status: LocationStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Aktif</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary">Nonaktif</Badge>
      case 'MAINTENANCE':
        return <Badge variant="outline">Maintenance</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data lokasi...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Manajemen Lokasi Stasiun
              </CardTitle>
              <CardDescription>
                Kelola lokasi stasiun curah hujan dan informasi terkait ({locations.length} lokasi)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refetch} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Lokasi
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? "Edit Lokasi" : "Tambah Lokasi Baru"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingLocation 
                        ? "Perbarui informasi lokasi stasiun"
                        : "Tambahkan lokasi stasiun curah hujan baru"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lokasi *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Contoh: Gosowong Pit"
                          disabled={mutationLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="code">Kode Lokasi *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Contoh: GSW-PIT"
                          disabled={mutationLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Deskripsi lokasi (opsional)"
                          rows={3}
                          disabled={mutationLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="coordinates">Koordinat (Opsional)</Label>
                        <Input
                          id="coordinates"
                          value={formData.coordinates}
                          onChange={(e) => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                          placeholder="Contoh: 7°15'30&quot; LS, 110°25'45&quot; BT atau -7.2583, 110.4292"
                          disabled={mutationLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: DMS (7°15'30&quot; LS, 110°25'45&quot; BT) atau Desimal (-7.2583, 110.4292)
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        disabled={mutationLoading}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={mutationLoading}>
                        {mutationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingLocation ? "Perbarui" : "Tambah"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lokasi</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Koordinat</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{location.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {location.latitude && location.longitude ? (
                        <div className="text-sm">
                          <div className="font-mono">{formatCoordinates(location.latitude, location.longitude)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={location.description || ""}>
                        {location.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleStatusToggle(location.id, location.status)}
                      >
                        {getStatusBadge(location.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          disabled={mutationLoading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(location.id, location.name)}
                          className="text-red-600 hover:text-red-700"
                          disabled={mutationLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {locations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Belum ada data lokasi. Tambahkan lokasi baru untuk memulai.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
