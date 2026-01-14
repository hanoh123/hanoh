"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface News {
  id: string
  tickerId: string
  headline: string
  summary?: string
  source: string
  url?: string
  imageUrl?: string
  author?: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  ticker: {
    id: string
    symbol: string
    name: string
  }
}

interface NewsEditDialogProps {
  news: News
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewsUpdated: (news: News) => void
}

export function NewsEditDialog({ news, open, onOpenChange, onNewsUpdated }: NewsEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [formData, setFormData] = useState({
    headline: '',
    summary: '',
    source: '',
    url: '',
    imageUrl: '',
    author: '',
    publishedAt: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open && news) {
      // Initialize form with news data
      const publishedDate = new Date(news.publishedAt)
      setFormData({
        headline: news.headline,
        summary: news.summary || '',
        source: news.source,
        url: news.url || '',
        imageUrl: news.imageUrl || '',
        author: news.author || '',
        publishedAt: publishedDate.toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM format
      })
      setWarnings([])
    }
  }, [open, news])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.headline || !formData.source || !formData.publishedAt) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setWarnings([])

    try {
      const response = await fetch(`/api/admin/news/${news.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          publishedAt: new Date(formData.publishedAt).toISOString(),
          // Remove empty optional fields
          summary: formData.summary || undefined,
          url: formData.url || undefined,
          imageUrl: formData.imageUrl || undefined,
          author: formData.author || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Handle duplicate detection
          toast({
            title: 'Duplicate Article',
            description: result.details?.message || result.error,
            variant: 'destructive',
          })
          return
        }
        
        throw new Error(result.error || 'Failed to update news article')
      }

      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
        toast({
          title: 'News Updated with Warnings',
          description: `Article updated but please review: ${result.warnings.join(', ')}`,
        })
      }

      onNewsUpdated(result.news)
      onOpenChange(false)
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
    // Clear warnings when user makes changes
    if (warnings.length > 0) {
      setWarnings([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit News Article - {news?.ticker.symbol}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker Info (Read-only) */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm font-medium text-gray-700">Ticker</div>
            <div className="text-lg font-semibold text-primary">
              {news?.ticker.symbol} - {news?.ticker.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Ticker cannot be changed after creation
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Headline *</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => handleInputChange('headline', e.target.value)}
              placeholder="Enter news headline"
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-500">
              {formData.headline.length}/500 characters
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Optional article summary"
              maxLength={2000}
              rows={3}
            />
            <div className="text-xs text-gray-500">
              {formData.summary.length}/2000 characters
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              placeholder="e.g., Reuters, Bloomberg, Yahoo Finance"
              maxLength={100}
              required
            />
            <div className="text-xs text-gray-500">
              {formData.source.length}/100 characters
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Article URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://example.com/article"
            />
            <div className="text-xs text-gray-500">
              Used for deduplication - changing this may trigger duplicate detection
            </div>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              placeholder="Article author name"
              maxLength={200}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Published Date */}
          <div className="space-y-2">
            <Label htmlFor="publishedAt">Published Date *</Label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={formData.publishedAt}
              onChange={(e) => handleInputChange('publishedAt', e.target.value)}
              required
            />
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">Warnings:</div>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update News
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}