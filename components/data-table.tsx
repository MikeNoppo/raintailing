"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { exportRainfallPivotToExcel } from "@/lib/utils/excel-export"

interface DataTableProps {
  data: Array<{
    date: string
    rainfall: number
    location: string
  }>
}

export function DataTable({ data }: DataTableProps) {
  const exportToExcel = async () => {
    try {
      await exportRainfallPivotToExcel(data)
      toast.success("Data berhasil diekspor ke Excel")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Gagal mengekspor data ke Excel")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tabel Data Curah Hujan</CardTitle>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Curah Hujan (mm)</TableHead>
                <TableHead>Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(row.date).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{row.rainfall}</TableCell>
                  <TableCell>{row.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Tidak ada data yang ditemukan</div>
        )}
      </CardContent>
    </Card>
  )
}
