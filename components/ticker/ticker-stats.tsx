import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatVolume, formatMarketCap } from '@/lib/utils'

interface TickerStatsProps {
  ticker: {
    currentPrice: number
    volume: number
    marketCap: number
    float: number
    sharesOutstanding: number
    change24h: number
    changePercent24h: number
  }
}

export function TickerStats({ ticker }: TickerStatsProps) {
  const stats = [
    {
      label: 'Current Price',
      value: formatPrice(ticker.currentPrice),
      description: '24h change'
    },
    {
      label: 'Volume',
      value: formatVolume(ticker.volume),
      description: '24h trading volume'
    },
    {
      label: 'Market Cap',
      value: formatMarketCap(ticker.marketCap),
      description: 'Total market value'
    },
    {
      label: 'Float',
      value: formatVolume(ticker.float),
      description: 'Shares available for trading'
    },
    {
      label: 'Shares Outstanding',
      value: formatVolume(ticker.sharesOutstanding),
      description: 'Total shares issued'
    },
    {
      label: 'Float %',
      value: `${((ticker.float / ticker.sharesOutstanding) * 100).toFixed(1)}%`,
      description: 'Float as % of outstanding'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Risk Warning:</strong> Penny stocks are highly volatile and speculative. 
              Only invest what you can afford to lose.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}