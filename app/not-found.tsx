import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Ticker Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The stock ticker you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/screener">
              <Search className="h-4 w-4 mr-2" />
              Browse Stocks
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}