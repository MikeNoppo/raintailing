"use client"

import { useState, useEffect } from "react"
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
import { MapPin, Plus, Edit2, Trash2, Save } from "lucide-react"
import { toast } from "sonner"

interface Location {
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

// Default locations based on your Excel data
const defaultLocations: Location[] = [
  {
    id: "1",
    name: "Gosowong Pit",
    code: "GSW-PIT",
    description: "Stasiun monitoring di area pit Gosowong",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "2", 
    name: "Gosowong Helipad (DP3)",
    code: "GSW-DP3",
    description: "Stasiun monitoring di helipad Gosowong DP3",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "3",
    name: "Tailing dam (TSF)",
    code: "TSF",
    description: "Stasiun monitoring di tailing storage facility",
    status: "active", 
    createdAt: new Date("2024-01-01")
  },
  {
    id: "4",
    name: "Kencana (Portal)",
    code: "KNC-PRT",
    description: "Stasiun monitoring di portal Kencana",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "5",
    name: "Toguraci (Portal)",
    code: "TGR-PRT", 
    description: "Stasiun monitoring di portal Toguraci",
    status: "active",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "6",
    name: "Gosowong North",
    code: "GSW-NTH",
    description: "Stasiun monitoring di area utara Gosowong",
    status: "active",
    createdAt: new Date("2024-01-01")
  }
]

export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>(defaultLocations)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    lat: "",
    lng: ""
  })

  // Load locations from localStorage on component mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('rainfall-locations')
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations)
        setLocations(parsed)
      } catch (error) {
        console.error('Error loading locations:', error)
        // Use default locations if there's an error
        setLocations(defaultLocations)
      }
    }
  }, [])

  // Save locations to localStorage whenever locations change
  useEffect(() => {
    localStorage.setItem('rainfall-locations', JSON.stringify(locations))
  }, [locations])

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      lat: "",
      lng: ""
    })
    setEditingLocation(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Nama dan kode lokasi wajib diisi")
      return
    }

    // Check if code already exists (except when editing)
    const codeExists = locations.some(loc => 
      loc.code.toLowerCase() === formData.code.toLowerCase() && 
      loc.id !== editingLocation?.id
    )

    if (codeExists) {
      toast.error("Kode lokasi sudah digunakan")
      return
    }

    const locationData: Location = {
      id: editingLocation?.id || Date.now().toString(),
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
      coordinates: formData.lat && formData.lng ? {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      } : undefined,
      status: 'active',
      createdAt: editingLocation?.createdAt || new Date()
    }

    if (editingLocation) {
      // Update existing location
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? locationData : loc
      ))
      toast.success("Lokasi berhasil diperbarui")
    } else {
      // Add new location
      setLocations(prev => [...prev, locationData])
      toast.success("Lokasi baru berhasil ditambahkan")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      code: location.code,
      description: location.description || "",
      lat: location.coordinates?.lat.toString() || "",
      lng: location.coordinates?.lng.toString() || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (locationId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) {
      setLocations(prev => prev.filter(loc => loc.id !== locationId))
      toast.success("Lokasi berhasil dihapus")
    }
  }

  const toggleStatus = (locationId: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === locationId 
        ? { ...loc, status: loc.status === 'active' ? 'inactive' : 'active' }
        : loc
    ))
    toast.success("Status lokasi berhasil diubah")
  }

  const exportLocations = () => {
    const dataStr = JSON.stringify(locations, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rainfall-locations.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Data lokasi berhasil diekspor")
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
                Kelola lokasi stasiun curah hujan dan informasi terkait
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportLocations}>
                <Save className="mr-2 h-4 w-4" />
                Export
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
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="code">Kode Lokasi *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Contoh: GSW-PIT"
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
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                          <Label htmlFor="lat">Latitude</Label>
                          <Input
                            id="lat"
                            type="number"
                            step="any"
                            value={formData.lat}
                            onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                            placeholder="-6.123456"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lng">Longitude</Label>
                          <Input
                            id="lng"
                            type="number"
                            step="any"
                            value={formData.lng}
                            onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                            placeholder="106.123456"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit">
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
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Koordinat</TableHead>
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
                      <div className="max-w-[200px] truncate" title={location.description}>
                        {location.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {location.coordinates ? (
                        <div className="text-sm">
                          <div>{location.coordinates.lat.toFixed(6)}</div>
                          <div>{location.coordinates.lng.toFixed(6)}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={location.status === 'active' ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleStatus(location.id)}
                      >
                        {location.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(location)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(location.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
