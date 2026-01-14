"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Plus } from 'lucide-react'
import Link from 'next/link'

interface UserAlertsProps {
  userId: string
}

export function UserAlerts({ userId }: UserAlertsProps) {
  // Placeholder for Sprint 2 - basic structure
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Price Alerts</span>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Alert
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">No alerts set up yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Get notified when your watched stocks hit target prices
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}