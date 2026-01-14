import { Button } from '@/components/ui/button'
import { TrendingUp, Search, Bell } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Discover Penny Stock
          <span className="text-primary block">Opportunities</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track microcap stocks with real-time catalysts, volume spikes, and comprehensive 
          analysis. Find the next big opportunity before everyone else.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" asChild>
            <Link href="/screener">
              <Search className="h-5 w-5 mr-2" />
              Start Screening
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">
              <Bell className="h-5 w-5 mr-2" />
              Get Alerts
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Tracking</h3>
              <p className="text-gray-600 text-sm">
                Monitor penny stocks with live price updates and volume analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Advanced Screening</h3>
              <p className="text-gray-600 text-sm">
                Filter stocks by price, volume, market cap, and technical indicators
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Alerts</h3>
              <p className="text-gray-600 text-sm">
                Get notified of price movements, volume spikes, and catalyst events
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}