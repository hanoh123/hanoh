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

interface Ticker {
  id: string
  symbol: string
  name: string
}

interface CatalystCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCatalystCreated: (catalyst: any) => void
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

export function CatalystCreateDialog({ open, onOpenChange, onCatalystCreated }: CatalystCreateDialogProps) {
  const [formData, setFormData] = useState({
    tickerId: '',
    title: '',
    description: '',
    date: '',
    category: 'EARNINGS',
    impactLevel: 'MEDIUM',
  })
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTickers, setIsLoadingTickers] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchTickers()
    }
  }, [open])

  const fetchTickers = async () => {
    try {
      setIsLoadingTickers(true)
      const response = await fetch('/api/admin/tickers?limit=1000') // Get all tickers for dropdown
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickers')
      }

      const data = await response.json()
      setTickers(data.tickers)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tickers',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingTickers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setWarnings([])

    try {
      const payload = {
        tickerId: formData.tickerId,
        title: formData.title,
        description: formData.description || undefined,
        date: new Date(formData.date).toISOString(),
        category: formData.category,
        impactLevel: formData.impactLevel,
      }

      const response = await fetch('/api/admin/catalysts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create catalyst')
      }

      if (data.warnings) {
        setWarnings(data.warnings)
      }

      onCatalystCreated(data.catalyst)
      onOpenChange(false)
      resetForm()
      
      toast({
        title: 'Success',
        description: 'Catalyst created successfully',
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

  const resetForm = () => {
    setFormData({
      tickerId: '',
      title: '',
      description: '',
      date: '',
      category: 'EARNINGS',
      impactLevel: 'MEDIUM',
    })
    setWarnings([])
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Set default date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Catalyst</DialogTitle>
          <DialogDescription>
            Create a new catalyst event for a ticker. This will be visible to all users.
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
              <Label htmlFor="ticker">Ticker *</Label>
              {isLoadingTickers ? (
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading tickers...</span>
                </div>
              ) : (
                <select
                  id="ticker"
                  value={formData.tickerId}
                  onChange={(e) => handleInputChange('tickerId', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a ticker</option>
                  {tickers.map(ticker => (
                    <option key={ticker.id} value={ticker.id}>
                      {ticker.symbol} - {ticker.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || defaultDate}
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
            <Button type="submit" disabled={isLoading || isLoadingTickers}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Catalyst
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}