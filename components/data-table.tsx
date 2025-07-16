"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"

interface DataTableProps {
  data: Array<{
    date: string
    rainfall: number
    location: string
    level: string
  }>
}

export function DataTable({ data }: DataTableProps) {
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "normal":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Normal
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Peringatan
          </Badge>
        )
      case "danger":
        return <Badge variant="destructive">Bahaya</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const exportToExcel = () => {
    // Create CSV content
    const headers = ["Tanggal", "Curah Hujan (mm)", "Lokasi", "Status"]
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.date,
          row.rainfall,
          row.location,
          row.level === "normal" ? "Normal" : row.level === "warning" ? "Peringatan" : "Bahaya",
        ].join(","),
      ),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `data-curah-hujan-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                <TableHead>Status</TableHead>
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
                  <TableCell>{getLevelBadge(row.level)}</TableCell>
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
