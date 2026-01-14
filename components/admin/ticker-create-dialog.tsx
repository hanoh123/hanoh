"use client"

import { useState } from 'react'
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

interface TickerCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTickerCreated: (ticker: any) => void
}

export function TickerCreateDialog({ open, onOpenChange, onTickerCreated }: TickerCreateDialogProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    sector: '',
    exchange: '',
    marketCap: '',
    float: '',
    sharesOutstanding: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setWarnings([])

    try {
      const payload = {
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        sector: formData.sector || undefined,
        exchange: formData.exchange || undefined,
        marketCap: formData.marketCap ? parseFloat(formData.marketCap) : undefined,
        float: formData.float ? parseFloat(formData.float) : undefined,
        sharesOutstanding: formData.sharesOutstanding ? parseFloat(formData.sharesOutstanding) : undefined,
      }

      const response = await fetch('/api/admin/tickers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticker')
      }

      if (data.warnings) {
        setWarnings(data.warnings)
      }

      onTickerCreated(data.ticker)
      onOpenChange(false)
      resetForm()
      
      toast({
        title: 'Success',
        description: `Ticker ${data.ticker.symbol} created successfully`,
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
      symbol: '',
      name: '',
      sector: '',
      exchange: '',
      marketCap: '',
      float: '',
      sharesOutstanding: '',
    })
    setWarnings([])
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Ticker</DialogTitle>
          <DialogDescription>
            Create a new stock ticker entry. Symbol will be automatically converted to uppercase.
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
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                placeholder="AAPL"
                required
                maxLength={10}
                pattern="[A-Za-z]+"
                title="Only letters allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Input
                id="exchange"
                value={formData.exchange}
                onChange={(e) => handleInputChange('exchange', e.target.value)}
                placeholder="NASDAQ"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Apple Inc."
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
              placeholder="Technology"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marketCap">Market Cap</Label>
              <Input
                id="marketCap"
                type="number"
                value={formData.marketCap}
                onChange={(e) => handleInputChange('marketCap', e.target.value)}
                placeholder="1000000000"
                min="0"
                step="any"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="float">Float</Label>
              <Input
                id="float"
                type="number"
                value={formData.float}
                onChange={(e) => handleInputChange('float', e.target.value)}
                placeholder="500000000"
                min="0"
                step="any"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sharesOutstanding">Shares Outstanding</Label>
              <Input
                id="sharesOutstanding"
                type="number"
                value={formData.sharesOutstanding}
                onChange={(e) => handleInputChange('sharesOutstanding', e.target.value)}
                placeholder="1000000000"
                min="0"
                step="any"
              />
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
              Create Ticker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}