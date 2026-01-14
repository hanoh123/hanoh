"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  Filter,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { CatalystCreateDialog } from './catalyst-create-dialog'
import { CatalystEditDialog } from './catalyst-edit-dialog'
import { formatDate } from '@/lib/utils'

interface Catalyst {
  id: string
  tickerId: string
  title: string
  description?: string
  date: string
  category: string
  impactLevel: string
  createdAt: string
  updatedAt: string
  ticker: {
    id: string
    symbol: string
    name: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const categoryColors: Record<string, string> = {
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

const impactColors: Record<string, string> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'default',
  CRITICAL: 'destructive'
}

export function CatalystManagement() {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedImpact, setSelectedImpact] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCatalyst, setEditingCatalyst] = useState<Catalyst | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCatalysts()
  }, [pagination.page, selectedCategory, selectedImpact])

  const fetchCatalysts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedImpact) params.append('impactLevel', selectedImpact)

      const response = await fetch(`/api/admin/catalysts?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch catalysts')
      }

      const data = await response.json()
      setCatalysts(data.catalysts)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch catalysts',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCatalystCreated = (newCatalyst: Catalyst) => {
    setCatalysts(prev => [newCatalyst, ...prev])
    setPagination(prev => ({ ...prev, total: prev.total + 1 }))
    toast({
      title: 'Success',
      description: `Catalyst created for ${newCatalyst.ticker.symbol}`,
    })
  }

  const handleCatalystUpdated = (updatedCatalyst: Catalyst) => {
    setCatalysts(prev => prev.map(c => c.id === updatedCatalyst.id ? updatedCatalyst : c))
    toast({
      title: 'Success',
      description: 'Catalyst updated successfully',
    })
  }

  const handleDeleteCatalyst = async (catalyst: Catalyst) => {
    if (!confirm(`Are you sure you want to delete this catalyst?\n\n"${catalyst.title}"`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/catalysts/${catalyst.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete catalyst')
      }

      setCatalysts(prev => prev.filter(c => c.id !== catalyst.id))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      
      toast({
        title: 'Success',
        description: 'Catalyst deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const categories = Object.keys(categoryColors)
  const impactLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            value={selectedImpact}
            onChange={(e) => {
              setSelectedImpact(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Impact Levels</option>
            {impactLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Catalyst
        </Button>
      </div>

      {/* Catalysts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Catalysts ({pagination.total})</span>
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {catalysts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No catalysts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Ticker</th>
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Impact</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catalysts.map((catalyst) => {
                    const catalystDate = new Date(catalyst.date)
                    const isPast = catalystDate < new Date()
                    
                    return (
                      <tr key={catalyst.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatDate(catalyst.date)}</div>
                          {isPast && (
                            <div className="text-xs text-gray-500">Past event</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{catalyst.ticker.symbol}</div>
                          <div className="text-xs text-gray-500">{catalyst.ticker.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{catalyst.title}</div>
                          {catalyst.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {catalyst.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={categoryColors[catalyst.category]} variant="secondary">
                            {catalyst.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={impactColors[catalyst.impactLevel] as any}>
                            {catalyst.impactLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCatalyst(catalyst)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCatalyst(catalyst)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CatalystCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCatalystCreated={handleCatalystCreated}
      />

      {editingCatalyst && (
        <CatalystEditDialog
          catalyst={editingCatalyst}
          open={!!editingCatalyst}
          onOpenChange={(open) => !open && setEditingCatalyst(null)}
          onCatalystUpdated={handleCatalystUpdated}
        />
      )}
    </div>
  )
}