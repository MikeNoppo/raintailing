"use client"

import { useEffect, useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useLocations } from '@/lib/hooks/useLocations'
import { useRainfallDataById, useRainfallMutations } from '@/lib/hooks/useRainfallData'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RainfallEditDialogProps {
  id: string | null
  open: boolean
  onClose: () => void
  onUpdated?: () => void // callback to refresh parent list
}

export function RainfallEditDialog({ id, open, onClose, onUpdated }: RainfallEditDialogProps) {
  const { locations, loading: loadingLocations } = useLocations({ includeInactive: true })
  const { data, isLoading } = useRainfallDataById(id || '')
  const { updateRainfallData, isUpdating } = useRainfallMutations()

  // Local form state
  const [date, setDate] = useState<Date | null>(null)
  const [locationId, setLocationId] = useState<string>('')
  const [rainfall, setRainfall] = useState<string>('')

  // Populate when data loaded or id changes
  useEffect(() => {
    if (data && open) {
      setDate(new Date(data.date))
      setLocationId(data.locationId || data.location?.id)
      setRainfall(data.rainfall.toString())
    }
  }, [data, open])

  const isDirty = useMemo(() => {
    if (!data) return false
    const changed = (
      (date && date.toISOString() !== new Date(data.date).toISOString()) ||
      locationId !== (data.locationId || data.location?.id) ||
      (rainfall !== '' && parseFloat(rainfall) !== data.rainfall)
    )
    return changed
  }, [date, locationId, rainfall, data])

  const handleSubmit = async () => {
    if (!id) return
    if (!date || !locationId || rainfall === '') {
      toast.error('Lengkapi semua field wajib')
      return
    }
    const value = parseFloat(rainfall)
    if (isNaN(value) || value < 0) {
      toast.error('Curah hujan harus angka >= 0')
      return
    }
    try {
      await updateRainfallData(id, {
        date: date.toISOString(),
        rainfall: value,
        locationId,
      })
      toast.success('Data berhasil diperbarui')
      onUpdated?.()
      onClose()
    } catch {
      // toast already shown in hook
    }
  }

  const resetAndClose = () => {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Data Curah Hujan</DialogTitle>
        </DialogHeader>
        {(isLoading || loadingLocations) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
          </div>
        )}
        {!isLoading && data && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd MMMM yyyy', { locale: localeID }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={(d) => setDate(d || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Curah Hujan (mm)</Label>
              <Input
                value={rainfall}
                onChange={(e) => setRainfall(e.target.value)}
                type="number"
                min={0}
                step="0.1"
                placeholder="0"
              />
            </div>
          </div>
        )}
        <DialogFooter className="flex gap-2 pt-2">
          <Button variant="outline" onClick={resetAndClose} disabled={isUpdating}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!isDirty || isUpdating || isLoading}>
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
