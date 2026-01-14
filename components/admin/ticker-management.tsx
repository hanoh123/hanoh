"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingUp,
  Building,
  Users,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { TickerCreateDialog } from './ticker-create-dialog'
import { TickerEditDialog } from './ticker-edit-dialog'
import { formatMarketCap, formatVolume } from '@/lib/utils'

interface Ticker {
  id: string
  symbol: string
  name: string
  sector?: string
  exchange?: string
  marketCap?: number
  float?: number
  sharesOutstanding?: number
  currentPrice?: number
  volume?: number
  change24h?: number
  changePercent24h?: number
  createdAt: string
  updatedAt: string
  _count: {
    catalysts: number
    news: number
    watchlists: number
    alerts: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export function TickerManagement() {
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTicker, setEditingTicker] = useState<Ticker | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTickers()
  }, [pagination.page, searchQuery, selectedSector])

  const fetchTickers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchQuery) params.append('search', searchQuery)
      if (selectedSector) params.append('sector', selectedSector)

      const response = await fetch(`/api/admin/tickers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickers')
      }

      const data = await response.json()
      setTickers(data.tickers)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tickers',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSectorFilter = (sector: string) => {
    setSelectedSector(sector)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleTickerCreated = (newTicker: Ticker) => {
    setTickers(prev => [newTicker, ...prev])
    setPagination(prev => ({ ...prev, total: prev.total + 1 }))
    toast({
      title: 'Success',
      description: `Ticker ${newTicker.symbol} created successfully`,
    })
  }

  const handleTickerUpdated = (updatedTicker: Ticker) => {
    setTickers(prev => prev.map(t => t.id === updatedTicker.id ? updatedTicker : t))
    toast({
      title: 'Success',
      description: `Ticker ${updatedTicker.symbol} updated successfully`,
    })
  }

  const handleDeleteTicker = async (ticker: Ticker) => {
    if (!confirm(`Are you sure you want to delete ${ticker.symbol}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tickers/${ticker.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete ticker')
      }

      setTickers(prev => prev.filter(t => t.id !== ticker.id))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      
      toast({
        title: 'Success',
        description: `Ticker ${ticker.symbol} deleted successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const uniqueSectors = Array.from(new Set(tickers.map(t => t.sector).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedSector}
            onChange={(e) => handleSectorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Sectors</option>
            {uniqueSectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ticker
        </Button>
      </div>

      {/* Tickers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tickers ({pagination.total})</span>
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickers.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No tickers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Sector</th>
                    <th className="text-left py-3 px-4 font-medium">Market Cap</th>
                    <th className="text-left py-3 px-4 font-medium">Data</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickers.map((ticker) => (
                    <tr key={ticker.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-primary">{ticker.symbol}</div>
                        <div className="text-xs text-gray-500">{ticker.exchange}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{ticker.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        {ticker.sector && (
                          <Badge variant="outline">{ticker.sector}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ticker.marketCap ? formatMarketCap(ticker.marketCap) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{ticker._count.catalysts}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{ticker._count.news}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{ticker._count.watchlists}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTicker(ticker)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTicker(ticker)}
                            disabled={ticker._count.catalysts + ticker._count.news + ticker._count.watchlists > 0}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TickerCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTickerCreated={handleTickerCreated}
      />

      {editingTicker && (
        <TickerEditDialog
          ticker={editingTicker}
          open={!!editingTicker}
          onOpenChange={(open) => !open && setEditingTicker(null)}
          onTickerUpdated={handleTickerUpdated}
        />
      )}
    </div>
  )
}