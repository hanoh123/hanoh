import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { demoCatalysts } from '@/lib/demo-data'
import { formatDate } from '@/lib/utils'

const categoryColors = {
  EARNINGS: 'bg-blue-100 text-blue-800',
  FDA_APPROVAL: 'bg-green-100 text-green-800',
  PARTNERSHIP: 'bg-purple-100 text-purple-800',
  ACQUISITION: 'bg-orange-100 text-orange-800',
  PRODUCT_LAUNCH: 'bg-indigo-100 text-indigo-800',
  CLINICAL_TRIAL: 'bg-teal-100 text-teal-800',
  REGULATORY: 'bg-red-100 text-red-800',
  INSIDER_BUYING: 'bg-yellow-100 text-yellow-800',
  SHORT_SQUEEZE: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

const impactColors = {
  LOW: 'border-gray-300',
  MEDIUM: 'border-yellow-300',
  HIGH: 'border-orange-300',
  CRITICAL: 'border-red-300'
}

export function LatestCatalysts() {
  // Sort by date (most recent first)
  const latestCatalysts = [...demoCatalysts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Latest Catalysts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {latestCatalysts.map((catalyst) => (
            <div 
              key={catalyst.id} 
              className={`p-4 border-l-4 ${impactColors[catalyst.impactLevel]} bg-gray-50 rounded-r-lg`}
            >
              <div className="flex items-start justify-between mb-2">
                <Link 
                  href={`/ticker/${catalyst.ticker.symbol}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {catalyst.ticker.symbol}
                </Link>
                <Badge 
                  className={`text-xs ${categoryColors[catalyst.category]}`}
                  variant="secondary"
                >
                  {catalyst.category.replace('_', ' ')}
                </Badge>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2">
                {catalyst.title}
              </h4>
              
              <p className="text-sm text-gray-600 mb-3">
                {catalyst.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(catalyst.date)}</span>
                <Badge 
                  variant={catalyst.impactLevel === 'CRITICAL' ? 'destructive' : 
                          catalyst.impactLevel === 'HIGH' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {catalyst.impactLevel}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link href="/catalysts">View All Catalysts</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}