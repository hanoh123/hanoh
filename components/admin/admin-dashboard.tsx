"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  Settings, 
  Database,
  Plus,
  FileText,
  Newspaper
} from 'lucide-react'
import Link from 'next/link'

export function AdminDashboard() {
  // Placeholder stats for Sprint 2
  const stats = [
    {
      label: 'Total Tickers',
      value: '8',
      icon: TrendingUp,
      description: 'Active stock symbols',
      change: '+2 this week'
    },
    {
      label: 'Total Catalysts',
      value: '5',
      icon: Calendar,
      description: 'Upcoming events',
      change: '+1 today'
    },
    {
      label: 'News Articles',
      value: '0',
      icon: Newspaper,
      description: 'Published articles',
      change: 'Ready for content'
    },
    {
      label: 'Registered Users',
      value: '1',
      icon: Users,
      description: 'Platform users',
      change: 'Demo account'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Tickers',
      description: 'Add, edit, and manage stock symbols',
      icon: Plus,
      href: '/admin/tickers',
      disabled: false
    },
    {
      title: 'Manage Catalysts',
      description: 'Add and manage catalyst events',
      icon: Calendar,
      href: '/admin/catalysts',
      disabled: false
    },
    {
      title: 'Manage News',
      description: 'Add and manage news articles with deduplication',
      icon: Newspaper,
      href: '/admin/news',
      disabled: false
    },
    {
      title: 'Import Price History',
      description: 'Upload CSV files with price history data',
      icon: FileText,
      href: '/admin/imports',
      disabled: false
    },
    {
      title: 'System Settings',
      description: 'Configure application settings',
      icon: Settings,
      href: '/admin/settings',
      disabled: true
    }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {stat.change}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={action.disabled}
                      asChild={!action.disabled}
                    >
                      {action.disabled ? (
                        <>Coming in Sprint 3</>
                      ) : (
                        <Link href={action.href}>Get Started</Link>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Database seeded with demo data</p>
                <p className="text-xs text-gray-500">8 tickers and 5 catalysts added</p>
              </div>
              <span className="text-xs text-gray-400">Just now</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Admin account created</p>
                <p className="text-xs text-gray-500">System ready for management</p>
              </div>
              <span className="text-xs text-gray-400">5 min ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint 3 Preview */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader>
          <CardTitle className="text-gray-600">Coming in Sprint 3</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <h3 className="font-medium text-gray-600 mb-1">Ticker Management</h3>
              <p className="text-sm text-gray-500">Full CRUD operations for stocks</p>
            </div>
            <div className="p-4">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <h3 className="font-medium text-gray-600 mb-1">Catalyst Management</h3>
              <p className="text-sm text-gray-500">Create and manage events</p>
            </div>
            <div className="p-4">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <h3 className="font-medium text-gray-600 mb-1">Data Import</h3>
              <p className="text-sm text-gray-500">Bulk CSV import tools</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}