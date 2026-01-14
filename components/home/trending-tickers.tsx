import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Eye } from 'lucide-react'
import Link from 'next/link'
import { demoTickers } from '@/lib/demo-data'
import { formatPrice, formatVolume, formatMarketCap, formatPercentage, getPriceChangeClass } from '@/lib/utils'

export function TrendingTickers() {
  // Sort by volume for trending
  const trendingTickers = [...demoTickers]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Trending Tickers</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trendingTickers.map((ticker) => (
            <div key={ticker.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Link 
                    href={`/ticker/${ticker.symbol}`}
                    className="font-semibold text-lg hover:text-primary transition-colors"
                  >
                    {ticker.symbol}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {ticker.sector}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{ticker.name}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Vol: {formatVolume(ticker.volume)}</span>
                  <span>MCap: {formatMarketCap(ticker.marketCap)}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold mb-1">
                  {formatPrice(ticker.currentPrice)}
                </div>
                <div className={`text-sm font-medium ${getPriceChangeClass(ticker.change24h)}`}>
                  <div className="flex items-center space-x-1">
                    {ticker.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{formatPercentage(ticker.changePercent24h)}</span>
                  </div>
                </div>
              </div>
              
              <div className="ml-4">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/ticker/${ticker.symbol}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link href="/screener">View All Stocks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}