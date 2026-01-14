"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface WatchlistButtonProps {
  tickerId: string
  symbol: string
}

export function WatchlistButton({ tickerId, symbol }: WatchlistButtonProps) {
  const { data: session } = useSession()
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      checkWatchlistStatus()
    }
  }, [session, tickerId])

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        const inWatchlist = data.watchlist.some((item: any) => item.ticker.id === tickerId)
        setIsInWatchlist(inWatchlist)
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error)
    }
  }

  const handleWatchlistToggle = async () => {
    if (!session) {
      toast({
        title: 'Login required',
        description: 'Please log in to add stocks to your watchlist.',
        variant: 'destructive',
      })
      router.push('/auth/login')
      return
    }

    setIsLoading(true)

    try {
      if (isInWatchlist) {
        // Remove from watchlist - we'd need the watchlist item ID for this
        // For now, just show a message
        toast({
          title: 'Feature coming soon',
          description: 'Remove from watchlist functionality will be added in the next update.',
        })
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tickerId }),
        })

        if (response.ok) {
          setIsInWatchlist(true)
          toast({
            title: 'Added to watchlist',
            description: `${symbol} has been added to your watchlist.`,
          })
        } else {
          const data = await response.json()
          toast({
            title: 'Error',
            description: data.error || 'Failed to add to watchlist.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant={isInWatchlist ? "default" : "outline"}
      onClick={handleWatchlistToggle}
      disabled={isLoading}
    >
      <Heart className={`h-4 w-4 mr-2 ${isInWatchlist ? 'fill-current' : ''}`} />
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </Button>
  )
}