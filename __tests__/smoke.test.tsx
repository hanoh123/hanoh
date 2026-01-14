import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/page'
import TickerPage from '@/app/ticker/[symbol]/page'

// Mock the chart component since it uses recharts
jest.mock('@/components/ticker/price-chart', () => {
  return {
    PriceChart: () => <div data-testid="price-chart">Price Chart</div>
  }
})

describe('Smoke Tests', () => {
  it('renders home page without crashing', () => {
    render(<HomePage />)
    
    // Check for key elements
    expect(screen.getByText('Discover Penny Stock')).toBeInTheDocument()
    expect(screen.getByText('Trending Tickers')).toBeInTheDocument()
    expect(screen.getByText('Latest Catalysts')).toBeInTheDocument()
  })

  it('renders ticker page without crashing', () => {
    const mockParams = { symbol: 'AAPL' }
    
    render(<TickerPage params={mockParams} />)
    
    // Check for key elements
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText('Key Statistics')).toBeInTheDocument()
    expect(screen.getByTestId('price-chart')).toBeInTheDocument()
  })

  it('handles invalid ticker symbol gracefully', () => {
    const mockParams = { symbol: 'INVALID' }
    
    // This should not crash, but will show not found in actual app
    expect(() => render(<TickerPage params={mockParams} />)).not.toThrow()
  })
})