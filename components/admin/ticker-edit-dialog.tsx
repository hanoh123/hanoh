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
  sector?: string
  exchange?: string
  marketCap?: number
  float?: number
  sharesOutstanding?: number
}

interface TickerEditDialogProps {
  ticker: Ticker
  open: boolean
  onOpenChange: (open: boolean) => void
  onTickerUpdated: (ticker: any) => void
}

export function TickerEditDialog({ ticker, open, onOpenChange, onTickerUpdated }: TickerEditDialogProps) {
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (ticker) {
      setFormData({
        name: ticker.name,
        sector: ticker.sector || '',
        exchange: ticker.exchange || '',
        marketCap: ticker.marketCap?.toString() || '',
        float: ticker.float?.toString() || '',
        sharesOutstanding: ticker.sharesOutstanding?.toString() || '',
      })
    }
  }, [ticker])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setWarnings([])

    try {
      const payload = {
        name: formData.name,
        sector: formData.sector || undefined,
        exchange: formData.exchange || undefined,
        marketCap: formData.marketCap ? parseFloat(formData.marketCap) : undefined,
        float: formData.float ? parseFloat(formData.float) : undefined,
        sharesOutstanding: formData.sharesOutstanding ? parseFloat(formData.sharesOutstanding) : undefined,
      }

      const response = await fetch(`/api/admin/tickers/${ticker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ticker')
      }

      if (data.warnings) {
        setWarnings(data.warnings)
      }

      onTickerUpdated(data.ticker)
      onOpenChange(false)
      
      toast({
        title: 'Success',
        description: `Ticker ${ticker.symbol} updated successfully`,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Ticker: {ticker.symbol}</DialogTitle>
          <DialogDescription>
            Update ticker information. Symbol cannot be changed after creation.
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
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={ticker.symbol}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Symbol cannot be changed</p>
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
              Update Ticker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}