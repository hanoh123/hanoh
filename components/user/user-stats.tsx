"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Heart, Bell, TrendingUp } from 'lucide-react'

interface UserStatsProps {
  userId: string
}

export function UserStats({ userId }: UserStatsProps) {
  // Placeholder stats for Sprint 2
  const stats = [
    {
      label: 'Watchlist Items',
      value: '0',
      icon: Heart,
      description: 'Stocks you\'re tracking'
    },
    {
      label: 'Active Alerts',
      value: '0',
      icon: Bell,
      description: 'Price notifications set'
    },
    {
      label: 'Portfolio Value',
      value: 'N/A',
      icon: TrendingUp,
      description: 'Coming soon'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Your Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Add stocks to your watchlist to track their performance and set up price alerts.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}