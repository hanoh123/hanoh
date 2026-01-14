import { TrendingTickers } from '@/components/home/trending-tickers'
import { LatestCatalysts } from '@/components/home/latest-catalysts'
import { NewsTimeline } from '@/components/home/news-timeline'
import { Hero } from '@/components/home/hero'
import { MarketOverview } from '@/components/home/market-overview'

// This is a server component by default
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Hero />
      <MarketOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TrendingTickers />
        </div>
        <div>
          <LatestCatalysts />
        </div>
      </div>
      
      {/* News Timeline Section */}
      <div className="mt-12">
        <NewsTimeline />
      </div>
    </div>
  )
}