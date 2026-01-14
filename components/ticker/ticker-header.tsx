import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Bell, TrendingUp, TrendingDown } from 'lucide-react'
import { formatPrice, formatPercentage, getPriceChangeClass } from '@/lib/utils'
import { WatchlistButton } from '@/components/ticker/watchlist-button'

interface TickerHeaderProps {
  ticker: {
    id: string
    symbol: string
    name: string
    currentPrice: number
    change24h: number
    changePercent24h: number
    sector: string
    volume: number
  }
}

export function TickerHeader({ ticker }: TickerHeaderProps) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{ticker.symbol}</h1>
            <Badge variant="outline">{ticker.sector}</Badge>
          </div>
          <p className="text-lg text-gray-600">{ticker.name}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPrice(ticker.currentPrice)}
            </div>
            <div className={`flex items-center space-x-1 text-lg font-medium ${getPriceChangeClass(ticker.change24h)}`}>
              {ticker.change24h >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {ticker.change24h >= 0 ? '+' : ''}{ticker.change24h.toFixed(2)} 
                ({formatPercentage(ticker.changePercent24h)})
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <WatchlistButton tickerId={ticker.id} symbol={ticker.symbol} />
            <Button size="sm" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Alert
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}