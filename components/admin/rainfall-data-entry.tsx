"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, Droplets, MapPin } from "lucide-react"
import { useLocations, useRainfallMutations } from "@/lib/hooks"
import { toast } from "sonner"
import type { Location } from "@/lib/types"

export function RainfallDataEntryForm() {
  const [formData, setFormData] = React.useState({
    date: '',
    rainfall: '',
    locationId: '',
    notes: ''
  })

  const { locations, loading: locationsLoading } = useLocations({ status: 'ACTIVE' })
  const { createRainfallData, isCreating } = useRainfallMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createRainfallData({
        date: formData.date,
        rainfall: parseFloat(formData.rainfall),
        locationId: formData.locationId,
        notes: formData.notes || undefined
      })

      // Reset form on success
      setFormData({
        date: '',
        rainfall: '',
        locationId: '',
        notes: ''
      })
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to create rainfall data:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isFormValid = formData.date && formData.rainfall && formData.locationId

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Input Data Curah Hujan
        </CardTitle>
        <CardDescription>
          Tambahkan data curah hujan baru ke dalam sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rainfall" className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Curah Hujan (mm)
              </Label>
              <Input
                id="rainfall"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.rainfall}
                onChange={(e) => handleInputChange('rainfall', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lokasi Stasiun
            </Label>
            <Select 
              value={formData.locationId} 
              onValueChange={(value) => handleInputChange('locationId', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={locationsLoading ? "Loading..." : "Pilih lokasi stasiun"} />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan jika diperlukan..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!isFormValid || isCreating}
              className="min-w-[120px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
