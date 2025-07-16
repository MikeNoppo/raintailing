"use client"

import type React from "react"

import { useState } from "react"
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

export function AdminPanel() {
  const [date, setDate] = useState<Date>()
  const [rainfall, setRainfall] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !rainfall || !location) {
      toast.error("Mohon lengkapi semua field yang wajib diisi")
      return
    }

    // Here you would typically send the data to your backend
    toast.success("Data curah hujan berhasil ditambahkan")

    // Reset form
    setDate(undefined)
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
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      toast.success(`File ${file.name} siap diproses`)
      // Here you would process the Excel file
    } else {
      toast.error("Mohon upload file Excel (.xls atau .xlsx)")
    }
  }

  return (
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
                  <SelectItem value="Station A">Stasiun A</SelectItem>
                  <SelectItem value="Station B">Stasiun B</SelectItem>
                  <SelectItem value="Station C">Stasiun C</SelectItem>
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
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer bg-transparent">
                  Pilih File Excel
                </Button>
              </label>
            </div>

            {/* File Format Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Format File Excel:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Kolom A: Tanggal (DD/MM/YYYY)</li>
                <li>• Kolom B: Curah Hujan (mm)</li>
                <li>• Kolom C: Lokasi Stasiun</li>
                <li>• Kolom D: Catatan (opsional)</li>
              </ul>
            </div>

            <Button className="w-full" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Proses File Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
