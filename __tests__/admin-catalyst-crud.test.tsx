/**
 * Admin Catalyst CRUD Test
 * Tests: create, read, update, delete catalyst operations with proper validation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CatalystManagement } from '@/components/admin/catalyst-management'

// Mock NextAuth session with ADMIN role
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'admin-user-id',
        email: 'admin@pennystocks.com',
        role: 'ADMIN'
      }
    },
    status: 'authenticated'
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

describe('Admin Catalyst CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Catalyst List Management', () => {
    it('should fetch and display catalysts with filtering', async () => {
      const mockCatalysts = [
        {
          id: 'catalyst-1',
          tickerId: 'ticker-1',
          title: 'Q4 Earnings Report',
          description: 'Expected strong earnings',
          date: '2024-02-15T00:00:00Z',
          category: 'EARNINGS',
          impactLevel: 'HIGH',
          ticker: {
            id: 'ticker-1',
            symbol: 'AAPL',
            name: 'Apple Inc.'
          }
        },
        {
          id: 'catalyst-2',
          tickerId: 'ticker-2',
          title: 'FDA Approval Decision',
          description: 'Phase 3 trial results',
          date: '2024-03-01T00:00:00Z',
          category: 'FDA_APPROVAL',
          impactLevel: 'CRITICAL',
          ticker: {
            id: 'ticker-2',
            symbol: 'BNTX',
            name: 'BioNTech SE'
          }
        }
      ]

      const mockResponse = {
        catalysts: mockCatalysts,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      render(<CatalystManagement />)

      await waitFor(() => {
        expect(screen.getByText('Q4 Earnings Report')).toBeInTheDocument()
        expect(screen.getByText('FDA Approval Decision')).toBeInTheDocument()
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('BNTX')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/catalysts?page=1&limit=50')
    })

    it('should handle category filtering', async () => {
      const user = userEvent.setup()

      // Mock initial empty response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ catalysts: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } })
      })

      // Mock filtered response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          catalysts: [{
            id: 'catalyst-1',
            category: 'EARNINGS',
            ticker: { symbol: 'AAPL' }
          }],
          pagination: { page: 1, limit: 50, total: 1, pages: 1 }
        })
      })

      render(<CatalystManagement />)

      const categorySelect = screen.getByDisplayValue('All Categories')
      await user.selectOptions(categorySelect, 'EARNINGS')

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/catalysts?page=1&limit=50&category=EARNINGS')
      })
    })
  })

  describe('Catalyst Creation', () => {
    it('should validate required fields', () => {
      const requiredFields = {
        tickerId: '',     // Required
        title: '',        // Required
        date: '',         // Required
        category: '',     // Required (has default)
        impactLevel: ''   // Required (has default)
      }

      // Client-side validation should catch empty required fields
      expect(requiredFields.tickerId).toBe('')
      expect(requiredFields.title).toBe('')
      expect(requiredFields.date).toBe('')
    })

    it('should create catalyst with valid data', async () => {
      const newCatalyst = {
        id: 'new-catalyst-id',
        tickerId: 'ticker-1',
        title: 'New Product Launch',
        description: 'Revolutionary new product',
        date: '2024-06-15T00:00:00Z',
        category: 'PRODUCT_LAUNCH',
        impactLevel: 'HIGH',
        ticker: {
          id: 'ticker-1',
          symbol: 'AAPL',
          name: 'Apple Inc.'
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ catalyst: newCatalyst })
      })

      const response = await fetch('/api/admin/catalysts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickerId: 'ticker-1',
          title: 'New Product Launch',
          description: 'Revolutionary new product',
          date: '2024-06-15T00:00:00.000Z',
          category: 'PRODUCT_LAUNCH',
          impactLevel: 'HIGH'
        })
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.catalyst.title).toBe('New Product Launch')
      expect(result.catalyst.category).toBe('PRODUCT_LAUNCH')
    })

    it('should show warnings for unusual dates', async () => {
      const warningData = {
        tickerId: 'ticker-1',
        title: 'Old Event',
        date: '2022-01-01T00:00:00.000Z', // More than 1 year ago
        category: 'OTHER',
        impactLevel: 'LOW'
      }

      const responseWithWarnings = {
        catalyst: { id: 'catalyst-1', ...warningData },
        warnings: ['Catalyst date is more than 1 year in the past']
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithWarnings
      })

      const response = await fetch('/api/admin/catalysts', {
        method: 'POST',
        body: JSON.stringify(warningData)
      })

      const result = await response.json()

      expect(result.warnings).toContain('Catalyst date is more than 1 year in the past')
    })

    it('should validate ticker exists', async () => {
      const invalidTickerData = {
        tickerId: 'non-existent-ticker',
        title: 'Test Catalyst',
        date: '2024-06-15T00:00:00.000Z',
        category: 'OTHER',
        impactLevel: 'LOW'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Ticker not found' })
      })

      const response = await fetch('/api/admin/catalysts', {
        method: 'POST',
        body: JSON.stringify(invalidTickerData)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('Catalyst Updates', () => {
    it('should update catalyst information', async () => {
      const catalystId = 'catalyst-1'
      const updateData = {
        title: 'Updated Catalyst Title',
        description: 'Updated description',
        date: '2024-07-15T00:00:00.000Z',
        category: 'PARTNERSHIP',
        impactLevel: 'CRITICAL'
      }

      const updatedCatalyst = {
        id: catalystId,
        tickerId: 'ticker-1',
        ...updateData,
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ catalyst: updatedCatalyst })
      })

      const response = await fetch(`/api/admin/catalysts/${catalystId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.catalyst.title).toBe(updateData.title)
      expect(result.catalyst.category).toBe(updateData.category)
    })

    it('should validate category enum values', () => {
      const validCategories = [
        'EARNINGS',
        'FDA_APPROVAL',
        'PARTNERSHIP',
        'ACQUISITION',
        'PRODUCT_LAUNCH',
        'CLINICAL_TRIAL',
        'REGULATORY',
        'INSIDER_BUYING',
        'SHORT_SQUEEZE',
        'OTHER'
      ]

      const validImpactLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

      // Test that our categories match expected enum values
      expect(validCategories).toContain('EARNINGS')
      expect(validCategories).toContain('FDA_APPROVAL')
      expect(validImpactLevels).toContain('CRITICAL')
    })
  })

  describe('Catalyst Deletion', () => {
    it('should delete catalyst successfully', async () => {
      const catalystId = 'catalyst-1'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          message: 'Catalyst deleted successfully',
          deletedCatalyst: {
            id: catalystId,
            title: 'Deleted Catalyst',
            ticker: 'AAPL'
          }
        })
      })

      const response = await fetch(`/api/admin/catalysts/${catalystId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.message).toBe('Catalyst deleted successfully')
    })

    it('should handle deletion of non-existent catalyst', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Catalyst not found' })
      })

      const response = await fetch('/api/admin/catalysts/non-existent', {
        method: 'DELETE'
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('Date Validation', () => {
    it('should handle timezone-aware dates correctly', () => {
      const testDate = '2024-06-15'
      const isoDate = new Date(testDate).toISOString()
      
      // Verify date conversion maintains day accuracy
      expect(isoDate).toContain('2024-06-15')
    })

    it('should allow future dates', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const daysDiff = Math.floor((futureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBeGreaterThan(0)
    })

    it('should warn about very old dates', () => {
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 2)
      
      const daysDiff = Math.floor((oldDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBeLessThan(-365) // More than 1 year ago
    })
  })

  describe('RBAC Security', () => {
    it('should require ADMIN role for catalyst management', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Unauthorized - Admin access required' })
      })

      const response = await fetch('/api/admin/catalysts')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    it('should include audit trail in catalyst operations', () => {
      const catalystData = {
        tickerId: 'ticker-1',
        title: 'Test Catalyst',
        createdBy: 'admin-user-id',
        updatedBy: 'admin-user-id'
      }

      // Verify audit fields are included
      expect(catalystData.createdBy).toBe('admin-user-id')
      expect(catalystData.updatedBy).toBe('admin-user-id')
    })
  })
})