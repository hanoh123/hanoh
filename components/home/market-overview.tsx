import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { marketOverviewData } from '@/lib/demo-data'
import { formatVolume, formatPercentage } from '@/lib/utils'

export function MarketOverview() {
  const { totalTickers, gainers, losers, unchanged, totalVolume, avgChange } = marketOverviewData

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Tickers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-2xl font-bold">{totalTickers.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Gainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-2xl font-bold text-success">{gainers.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Losers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-danger" />
            <span className="text-2xl font-bold text-danger">{losers.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">{formatVolume(totalVolume)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}