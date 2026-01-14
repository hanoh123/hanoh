"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Catalyst {
  id: string
  tickerId: string
  title: string
  description?: string
  date: string
  category: string
  impactLevel: string
  ticker: {
    id: string
    symbol: string
    name: string
  }
}

interface CatalystEditDialogProps {
  catalyst: Catalyst
  open: boolean
  onOpenChange: (open: boolean) => void
  onCatalystUpdated: (catalyst: any) => void
}

const categories = [
  { value: 'EARNINGS', label: 'Earnings' },
  { value: 'FDA_APPROVAL', label: 'FDA Approval' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'ACQUISITION', label: 'Acquisition' },
  { value: 'PRODUCT_LAUNCH', label: 'Product Launch' },
  { value: 'CLINICAL_TRIAL', label: 'Clinical Trial' },
  { value: 'REGULATORY', label: 'Regulatory' },
  { value: 'INSIDER_BUYING', label: 'Insider Buying' },
  { value: 'SHORT_SQUEEZE', label: 'Short Squeeze' },
  { value: 'OTHER', label: 'Other' },
]

const impactLevels = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

export function CatalystEditDialog({ catalyst, open, onOpenChange, onCatalystUpdated }: CatalystEditDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: 'EARNINGS',
    impactLevel: 'MEDIUM',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (catalyst) {
      const catalystDate = new Date(catalyst.date)
      setFormData({
        title: catalyst.title,
        description: catalyst.description || '',
        date: catalystDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        category: catalyst.category,
        impactLevel: catalyst.impactLevel,
      })
    }
  }, [catalyst])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setWarnings([])

    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        date: new Date(formData.date).toISOString(),
        category: formData.category,
        impactLevel: formData.impactLevel,
      }

      const response = await fetch(`/api/admin/catalysts/${catalyst.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update catalyst')
      }

      if (data.warnings) {
        setWarnings(data.warnings)
      }

      onCatalystUpdated(data.catalyst)
      onOpenChange(false)
      
      toast({
        title: 'Success',
        description: 'Catalyst updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Catalyst: {catalyst.ticker.symbol}</DialogTitle>
          <DialogDescription>
            Update catalyst information. The ticker cannot be changed after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Validation Warnings:</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                value={`${catalyst.ticker.symbol} - ${catalyst.ticker.name}`}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Ticker cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Q4 Earnings Report"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Expected strong earnings driven by new product launches..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impactLevel">Impact Level *</Label>
              <select
                id="impactLevel"
                value={formData.impactLevel}
                onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {impactLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Catalyst
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}