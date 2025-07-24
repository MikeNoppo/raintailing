"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      } else {
        toast.error("Mohon upload file Excel (.xls atau .xlsx)")
        setSelectedFile(null)
      }
    }
  }

  const handleProcessFile = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/rainfall/bulk', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success(`File berhasil diproses! ${result.imported || 0} data berhasil diimport.`)
        setSelectedFile(null)
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(result.error || 'Gagal memproses file')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Terjadi kesalahan saat memproses file')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload File Excel
        </CardTitle>
        <CardDescription>
          Upload file Excel untuk import data curah hujan dalam jumlah besar
        </CardDescription>
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
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drag & drop file Excel di sini
            </p>
            <p className="text-sm text-gray-500 mb-4">
              atau klik tombol di bawah untuk memilih file
            </p>
            
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
              disabled={isProcessing}
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
            disabled={!selectedFile || isProcessing}
            onClick={handleProcessFile}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? 'Memproses...' : 'Proses File Excel'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
