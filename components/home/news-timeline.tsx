"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Newspaper, 
  ExternalLink, 
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { formatDate, extractDomain } from '@/lib/utils'
import Link from 'next/link'
import type { PublicNewsTimelineResponse, PublicNewsItemWithTicker } from '@/types/public-api'

interface NewsItem {
  id: string
  headline: string
  summary?: string
  source: string
  url?: string
  imageUrl?: string
  author?: string
  publishedAt: string
  ticker: {
    symbol: string
    name: string
  }
}

interface NewsResponse {
  news: NewsItem[]
  pagination: {
    hasMore: boolean
    nextCursor: string | null
    limit: number
  }
}

export function NewsTimeline() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
        setNews([])
        setError(null)
      }

      const params = new URLSearchParams({
        limit: '20'
      })
      
      if (cursor) {
        params.append('cursor', cursor)
      }

      const response = await fetch(`/api/public/news?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data: PublicNewsTimelineResponse = await response.json()
      
      if (cursor) {
        setNews(prev => [...prev, ...data.news])
      } else {
        setNews(data.news)
      }
      
      setHasMore(data.pagination.hasMore)
      setNextCursor(data.pagination.nextCursor)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchNews(nextCursor)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Newspaper className="h-5 w-5" />
            <span>Latest News</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading news...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Newspaper className="h-5 w-5" />
            <span>Latest News</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Newspaper className="h-5 w-5" />
          <span>Latest News</span>
          {news.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {news.length} article{news.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No news articles available</p>
            <p className="text-sm text-gray-400 mt-1">
              Check back later for the latest updates
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((article) => {
              const publishedDate = new Date(article.publishedAt)
              const isRecent = (new Date().getTime() - publishedDate.getTime()) < (24 * 60 * 60 * 1000)
              
              return (
                <article key={article.id} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start space-x-4">
                    {article.imageUrl && (
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <Link 
                            href={`/ticker/${article.ticker.symbol}`}
                            className="flex items-center space-x-1 text-primary hover:text-primary/80 font-semibold"
                          >
                            <TrendingUp className="h-3 w-3" />
                            <span>{article.ticker.symbol}</span>
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {article.source}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                          {isRecent && (
                            <Badge variant="secondary" className="text-xs">
                              Recent
                            </Badge>
                          )}
                        </div>
                        
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:text-primary/80 text-sm flex-shrink-0 ml-2"
                          >
                            <span className="mr-1 hidden sm:inline">{extractDomain(article.url)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.headline}
                      </h3>
                      
                      {article.summary && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {article.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {article.author && (
                          <p className="text-xs text-gray-400">
                            By {article.author}
                          </p>
                        )}
                        <Link 
                          href={`/ticker/${article.ticker.symbol}`}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          View {article.ticker.symbol} →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
            
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full sm:w-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    'Load more news'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}