"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatPercentage, getPriceChangeClass } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface WatchlistItem {
  id: string
  ticker: {
    id: string
    symbol: string
    name: string
    currentPrice: number
    change24h: number
    changePercent24h: number
    sector: string
  }
  createdAt: string
}

interface UserWatchlistProps {
  userId: string
}

export function UserWatchlist({ userId }: UserWatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        setWatchlist(data.watchlist)
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWatchlist = async (watchlistId: string, symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist/${watchlistId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWatchlist(prev => prev.filter(item => item.id !== watchlistId))
        toast({
          title: 'Removed from watchlist',
          description: `${symbol} has been removed from your watchlist.`,
        })
      } else {
        throw new Error('Failed to remove from watchlist')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove ticker from watchlist.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>My Watchlist</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading watchlist...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5" />
          <span>My Watchlist</span>
          <Badge variant="secondary">{watchlist.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {watchlist.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Your watchlist is empty</p>
            <Button asChild>
              <Link href="/screener">Find Stocks to Watch</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {watchlist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link 
                      href={`/ticker/${item.ticker.symbol}`}
                      className="font-semibold text-lg hover:text-primary transition-colors"
                    >
                      {item.ticker.symbol}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {item.ticker.sector}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.ticker.name}</p>
                </div>
                
                <div className="text-right mr-4">
                  <div className="text-lg font-semibold mb-1">
                    {formatPrice(item.ticker.currentPrice)}
                  </div>
                  <div className={`text-sm font-medium ${getPriceChangeClass(item.ticker.change24h)}`}>
                    <div className="flex items-center space-x-1">
                      {item.ticker.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{formatPercentage(item.ticker.changePercent24h)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFromWatchlist(item.id, item.ticker.symbol)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}