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
  Newspaper,
  Filter,
  ExternalLink,
  Calendar
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { NewsCreateDialog } from './news-create-dialog'
import { NewsEditDialog } from './news-edit-dialog'
import { formatDate, extractDomain } from '@/lib/utils'

interface News {
  id: string
  tickerId: string
  headline: string
  summary?: string
  source: string
  url?: string
  imageUrl?: string
  author?: string
  publishedAt: string
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

export function NewsManagement() {
  const [news, setNews] = useState<News[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState('')
  const [selectedTickerId, setSelectedTickerId] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchNews()
  }, [pagination.page, searchQuery, selectedSource, selectedTickerId])

  const fetchNews = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      if (selectedSource) params.append('source', selectedSource)
      if (selectedTickerId) params.append('tickerId', selectedTickerId)

      const response = await fetch(`/api/admin/news?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      setNews(data.news)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch news articles',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewsCreated = (newNews: News) => {
    setNews(prev => [newNews, ...prev])
    setPagination(prev => ({ ...prev, total: prev.total + 1 }))
    toast({
      title: 'Success',
      description: `News article created for ${newNews.ticker.symbol}`,
    })
  }

  const handleNewsUpdated = (updatedNews: News) => {
    setNews(prev => prev.map(n => n.id === updatedNews.id ? updatedNews : n))
    toast({
      title: 'Success',
      description: 'News article updated successfully',
    })
  }

  const handleDeleteNews = async (newsItem: News) => {
    if (!confirm(`Are you sure you want to delete this news article?\n\n"${newsItem.headline}"`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/news/${newsItem.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete news article')
      }

      setNews(prev => prev.filter(n => n.id !== newsItem.id))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      
      toast({
        title: 'Success',
        description: 'News article deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchNews()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSource('')
    setSelectedTickerId('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Get unique sources for filter dropdown
  const uniqueSources = Array.from(new Set(news.map(n => n.source))).sort()

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search headlines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>

          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Sources</option>
            {uniqueSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          {(searchQuery || selectedSource || selectedTickerId) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add News
        </Button>
      </div>

      {/* News Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>News Articles ({pagination.total})</span>
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {news.length === 0 ? (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No news articles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Published</th>
                    <th className="text-left py-3 px-4 font-medium">Ticker</th>
                    <th className="text-left py-3 px-4 font-medium">Headline</th>
                    <th className="text-left py-3 px-4 font-medium">Source</th>
                    <th className="text-left py-3 px-4 font-medium">URL</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {news.map((newsItem) => {
                    const publishedDate = new Date(newsItem.publishedAt)
                    const isRecent = (new Date().getTime() - publishedDate.getTime()) < (24 * 60 * 60 * 1000)
                    
                    return (
                      <tr key={newsItem.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatDate(newsItem.publishedAt)}</div>
                          {isRecent && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Recent
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{newsItem.ticker.symbol}</div>
                          <div className="text-xs text-gray-500">{newsItem.ticker.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium line-clamp-2 max-w-md">{newsItem.headline}</div>
                          {newsItem.summary && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {newsItem.summary}
                            </div>
                          )}
                          {newsItem.author && (
                            <div className="text-xs text-gray-400 mt-1">
                              By {newsItem.author}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{newsItem.source}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {newsItem.url ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {extractDomain(newsItem.url)}
                              </span>
                              <a
                                href={newsItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No URL</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNews(newsItem)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteNews(newsItem)}
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
      <NewsCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onNewsCreated={handleNewsCreated}
      />

      {editingNews && (
        <NewsEditDialog
          news={editingNews}
          open={!!editingNews}
          onOpenChange={(open) => !open && setEditingNews(null)}
          onNewsUpdated={handleNewsUpdated}
        />
      )}
    </div>
  )
}