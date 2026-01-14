import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { TickerHeader } from '@/components/ticker/ticker-header'
import { PriceChart } from '@/components/ticker/price-chart'
import { TickerStats } from '@/components/ticker/ticker-stats'
import { CatalystsTimeline } from '@/components/ticker/catalysts-timeline'
import { TickerNews } from '@/components/ticker/ticker-news'
import { demoTickers, demoCatalysts, demoPriceHistory } from '@/lib/demo-data'

interface TickerPageProps {
  params: {
    symbol: string
  }
}

export async function generateMetadata({ params }: TickerPageProps): Promise<Metadata> {
  const ticker = demoTickers.find(t => t.symbol.toLowerCase() === params.symbol.toLowerCase())
  
  if (!ticker) {
    return {
      title: 'Ticker Not Found'
    }
  }

  const canonicalUrl = `/ticker/${ticker.symbol}`

  return {
    title: `${ticker.symbol} - ${ticker.name} Stock Analysis`,
    description: `Track ${ticker.name} (${ticker.symbol}) stock price, volume, catalysts and key metrics. Current price: $${ticker.currentPrice}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${ticker.symbol} - ${ticker.name} Stock Analysis`,
      description: `Track ${ticker.name} stock price, volume, and catalysts. Current: $${ticker.currentPrice} (${ticker.changePercent24h > 0 ? '+' : ''}${ticker.changePercent24h.toFixed(2)}%)`,
      url: canonicalUrl,
      images: [
        {
          url: `/og-ticker-${ticker.symbol.toLowerCase()}.png`,
          width: 1200,
          height: 630,
          alt: `${ticker.symbol} Stock Chart`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ticker.symbol} - ${ticker.name} Stock Analysis`,
      description: `Current: $${ticker.currentPrice} (${ticker.changePercent24h > 0 ? '+' : ''}${ticker.changePercent24h.toFixed(2)}%)`,
      images: [`/og-ticker-${ticker.symbol.toLowerCase()}.png`],
    },
  }
}

export default function TickerPage({ params }: TickerPageProps) {
  const ticker = demoTickers.find(t => t.symbol.toLowerCase() === params.symbol.toLowerCase())
  
  if (!ticker) {
    notFound()
  }

  // Get catalysts for this ticker
  const tickerCatalysts = demoCatalysts.filter(c => c.tickerId === ticker.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <TickerHeader ticker={ticker} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-8">
          <PriceChart 
            symbol={ticker.symbol} 
            priceHistory={demoPriceHistory}
            currentPrice={ticker.currentPrice}
          />
          <CatalystsTimeline catalysts={tickerCatalysts} />
          <TickerNews symbol={ticker.symbol} />
        </div>
        
        <div>
          <TickerStats ticker={ticker} />
        </div>
      </div>
    </div>
  )
}