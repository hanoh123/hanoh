import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Catalyst {
  id: string
  title: string
  description: string
  date: Date
  category: string
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface CatalystsTimelineProps {
  catalysts: Catalyst[]
}

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
  LOW: 'border-gray-300 bg-gray-50',
  MEDIUM: 'border-yellow-300 bg-yellow-50',
  HIGH: 'border-orange-300 bg-orange-50',
  CRITICAL: 'border-red-300 bg-red-50'
}

export function CatalystsTimeline({ catalysts }: CatalystsTimelineProps) {
  if (catalysts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Catalysts Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No catalysts found for this ticker.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort catalysts by date (most recent first)
  const sortedCatalysts = [...catalysts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Catalysts Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCatalysts.map((catalyst, index) => (
            <div key={catalyst.id} className="relative">
              {/* Timeline line */}
              {index < sortedCatalysts.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200" />
              )}
              
              <div className={`border-l-4 ${impactColors[catalyst.impactLevel]} rounded-r-lg p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formatDate(catalyst.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`text-xs ${categoryColors[catalyst.category as keyof typeof categoryColors] || categoryColors.OTHER}`}
                      variant="secondary"
                    >
                      {catalyst.category.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={catalyst.impactLevel === 'CRITICAL' ? 'destructive' : 
                              catalyst.impactLevel === 'HIGH' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {catalyst.impactLevel}
                    </Badge>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">
                  {catalyst.title}
                </h4>
                
                <p className="text-sm text-gray-600">
                  {catalyst.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}