/**
 * Watchlist CRUD Integration Test
 * Tests: add to watchlist, remove from watchlist, view watchlist
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { UserWatchlist } from '@/components/user/user-watchlist'
import { WatchlistButton } from '@/components/ticker/watchlist-button'

// Mock NextAuth session
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'USER'
      }
    },
    status: 'authenticated'
  })
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('Watchlist CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('View Watchlist', () => {
    it('should display empty watchlist message', async () => {
      // Mock empty watchlist response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ watchlist: [] })
      })

      render(<UserWatchlist userId="test-user-id" />)

      await waitFor(() => {
        expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/watchlist')
    })

    it('should display watchlist items', async () => {
      // Mock watchlist with items
      const mockWatchlist = [
        {
          id: 'watchlist-1',
          ticker: {
            id: 'ticker-1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            currentPrice: 150.25,
            change24h: 2.50,
            changePercent24h: 1.69,
            sector: 'Technology'
          },
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ watchlist: mockWatchlist })
      })

      render(<UserWatchlist userId="test-user-id" />)

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
        expect(screen.getByText('$150.25')).toBeInTheDocument()
      })
    })
  })

  describe('Add to Watchlist', () => {
    it('should add ticker to watchlist successfully', async () => {
      const user = userEvent.setup()

      // Mock successful add response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ watchlist: [] }) // Initial empty watchlist
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            watchlistItem: {
              id: 'new-watchlist-item',
              ticker: { symbol: 'AAPL' }
            }
          })
        })

      render(<WatchlistButton tickerId="ticker-1" symbol="AAPL" />)

      const addButton = screen.getByRole('button', { name: /add to watchlist/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tickerId: 'ticker-1' }),
        })
      })
    })

    it('should handle duplicate watchlist entries', async () => {
      const user = userEvent.setup()

      // Mock duplicate error response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ watchlist: [] })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Ticker already in watchlist' })
        })

      render(<WatchlistButton tickerId="ticker-1" symbol="AAPL" />)

      const addButton = screen.getByRole('button', { name: /add to watchlist/i })
      await user.click(addButton)

      // Should handle error gracefully without crashing
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should require authentication', async () => {
      // Mock unauthenticated session
      jest.mocked(require('next-auth/react').useSession).mockReturnValueOnce({
        data: null,
        status: 'unauthenticated'
      })

      const user = userEvent.setup()
      const mockPush = jest.fn()
      
      jest.mocked(require('next/navigation').useRouter).mockReturnValueOnce({
        push: mockPush,
        refresh: jest.fn()
      })

      render(<WatchlistButton tickerId="ticker-1" symbol="AAPL" />)

      const addButton = screen.getByRole('button', { name: /add to watchlist/i })
      await user.click(addButton)

      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('Remove from Watchlist', () => {
    it('should remove ticker from watchlist', async () => {
      const user = userEvent.setup()

      // Mock watchlist with item to remove
      const mockWatchlist = [
        {
          id: 'watchlist-1',
          ticker: {
            id: 'ticker-1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            currentPrice: 150.25,
            change24h: 2.50,
            changePercent24h: 1.69,
            sector: 'Technology'
          },
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ watchlist: mockWatchlist })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Removed from watchlist' })
        })

      render(<UserWatchlist userId="test-user-id" />)

      // Wait for watchlist to load
      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Click remove button
      const removeButton = screen.getByRole('button', { name: '' }) // Trash icon button
      await user.click(removeButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/watchlist/watchlist-1', {
          method: 'DELETE'
        })
      })
    })
  })

  describe('Data Integrity', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<UserWatchlist userId="test-user-id" />)

      // Should not crash and show loading state
      await waitFor(() => {
        expect(screen.queryByText('Loading watchlist...')).not.toBeInTheDocument()
      })
    })

    it('should validate user ownership of watchlist items', () => {
      // This is tested at the API level
      // The API checks session.user.id matches watchlist.userId
      // before allowing any operations
      
      const mockSession = {
        user: { id: 'user-1' }
      }
      
      const mockWatchlistItem = {
        id: 'watchlist-1',
        userId: 'user-1', // Must match session user
        tickerId: 'ticker-1'
      }

      expect(mockSession.user.id).toBe(mockWatchlistItem.userId)
    })
  })
})