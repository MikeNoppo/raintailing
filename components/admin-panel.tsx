"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, Plus, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "sonner"
import { LocationManagement } from "@/components/location-management"

interface Location {
  id: string;
  name: string;
  code: string;
  status: string;
}

export function AdminPanel() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [rainfall, setRainfall] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load locations from localStorage
  useEffect(() => {
    const savedLocations = localStorage.getItem('rainfall-locations')
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations)
        setLocations(parsed.filter((loc: Location) => loc.status === 'active'))
      } catch (error) {
        console.error('Error loading locations:', error)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !rainfall || !location) {
      toast.error("Mohon lengkapi semua field yang wajib diisi")
      return
    }

    // Here you would typically send the data to your backend
    toast.success("Data curah hujan berhasil ditambahkan")

    // Reset form
    setDate(new Date())
    setRainfall("")
    setLocation("")
    setNotes("")
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = (files: FileList) => {
    const file = files[0]
    if (file) {
      if (
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      ) {
        setSelectedFile(file)
        toast.success(`File ${file.name} berhasil dipilih dan siap diproses`)
        // Here you would process the Excel file
        console.log('File selected:', file)
      } else {
        toast.error("Mohon upload file Excel (.xls atau .xlsx)")
        setSelectedFile(null)
      }
    }
  }

  const handleProcessFile = () => {
    if (selectedFile) {
      toast.success(`Memproses file ${selectedFile.name}...`)
      // Here you would implement the actual file processing logic
      console.log('Processing file:', selectedFile)
    }
  }

  return (
    <div className="space-y-8">
      {/* Input Data Manual dan Upload File Excel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Data Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Input Data Manual
            </CardTitle>
            <CardDescription>Tambahkan data curah hujan secara manual</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    <div className="p-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDate(new Date())}
                        className="w-full"
                      >
                        Hari Ini
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rainfall">Curah Hujan (mm) *</Label>
                <Input
                  id="rainfall"
                  type="number"
                  step="0.1"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  placeholder="Masukkan curah hujan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi Stasiun *</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih lokasi stasiun" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length > 0 ? (
                      locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.code}>
                          {loc.name} ({loc.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-locations" value="no-locations" disabled>
                        Tidak ada lokasi aktif. Tambahkan di menu Manajemen Lokasi.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload File Excel
            </CardTitle>
            <CardDescription>Upload file Excel untuk import data dalam jumlah besar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Drag & drop file Excel di sini</p>
                <p className="text-sm text-gray-500 mb-4">atau klik tombol di bawah untuk memilih file</p>
                
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                  ref={fileInputRef}
                />
                
                <Button 
                  variant="outline" 
                  className="cursor-pointer bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Pilih File Excel
                </Button>
              </div>

              {/* Show selected file */}
              {selectedFile && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>File dipilih:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                disabled={!selectedFile}
                onClick={handleProcessFile}
              >
                <Upload className="mr-2 h-4 w-4" />
                Proses File Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manajemen Lokasi Stasiun */}
      <LocationManagement />
    </div>
  )
}
