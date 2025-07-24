import { LocationManagement } from "@/components/admin/location-management"
import { RainfallDataEntryForm } from "@/components/admin/rainfall-data-entry"
import { FileUpload } from "@/components/admin/file-upload"

export function AdminPanel() {
  return (
    <div className="space-y-6">
      {/* Data Entry Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Data Input */}
        <div>
          <RainfallDataEntryForm />
        </div>

        {/* File Upload */}
        <div> 
          <FileUpload />
        </div>
      </div>
      
      {/* Location Management */}
      <LocationManagement />
    </div>
  )
}
