// Demo data for development and testing

export const demoTickers = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 185.25,
    change24h: 3.75,
    changePercent24h: 2.07,
    volume: 52000000,
    marketCap: 2850000000000,
    sector: 'Technology',
    float: 15000000000,
    sharesOutstanding: 15400000000
  },
  {
    id: '2',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    currentPrice: 245.67,
    change24h: -8.33,
    changePercent24h: -3.28,
    volume: 89000000,
    marketCap: 780000000000,
    sector: 'Automotive',
    float: 3100000000,
    sharesOutstanding: 3170000000
  },
  {
    id: '3',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    currentPrice: 875.43,
    change24h: 45.21,
    changePercent24h: 5.45,
    volume: 35000000,
    marketCap: 2150000000000,
    sector: 'Technology',
    float: 2450000000,
    sharesOutstanding: 2460000000
  },
  {
    id: '4',
    symbol: 'SNDL',
    name: 'Sundial Growers Inc.',
    currentPrice: 0.85,
    change24h: 0.12,
    changePercent24h: 16.44,
    volume: 125000000,
    marketCap: 1850000000,
    sector: 'Healthcare',
    float: 2100000000,
    sharesOutstanding: 2180000000
  },
  {
    id: '5',
    symbol: 'AMC',
    name: 'AMC Entertainment Holdings',
    currentPrice: 4.23,
    change24h: -0.67,
    changePercent24h: -13.67,
    volume: 78000000,
    marketCap: 2100000000,
    sector: 'Entertainment',
    float: 516000000,
    sharesOutstanding: 516000000
  },
  {
    id: '6',
    symbol: 'BBBY',
    name: 'Bed Bath & Beyond Inc.',
    currentPrice: 0.12,
    change24h: 0.03,
    changePercent24h: 33.33,
    volume: 245000000,
    marketCap: 95000000,
    sector: 'Retail',
    float: 792000000,
    sharesOutstanding: 792000000
  },
  {
    id: '7',
    symbol: 'MULN',
    name: 'Mullen Automotive Inc.',
    currentPrice: 0.045,
    change24h: 0.008,
    changePercent24h: 21.62,
    volume: 156000000,
    marketCap: 185000000,
    sector: 'Automotive',
    float: 4100000000,
    sharesOutstanding: 4100000000
  },
  {
    id: '8',
    symbol: 'GNUS',
    name: 'Genius Brands International',
    currentPrice: 0.78,
    change24h: -0.15,
    changePercent24h: -16.13,
    volume: 89000000,
    marketCap: 245000000,
    sector: 'Media',
    float: 314000000,
    sharesOutstanding: 314000000
  }
]

export const demoCatalysts = [
  {
    id: '1',
    tickerId: '4',
    ticker: demoTickers[3],
    title: 'Q4 Earnings Report Expected',
    description: 'Sundial Growers expected to report Q4 earnings with potential positive guidance for 2024.',
    date: new Date('2024-02-15'),
    category: 'EARNINGS' as const,
    impactLevel: 'HIGH' as const,
    createdAt: new Date()
  },
  {
    id: '2',
    tickerId: '6',
    ticker: demoTickers[5],
    title: 'Bankruptcy Proceedings Update',
    description: 'Court hearing scheduled for asset liquidation plan review.',
    date: new Date('2024-02-10'),
    category: 'REGULATORY' as const,
    impactLevel: 'CRITICAL' as const,
    createdAt: new Date()
  },
  {
    id: '3',
    tickerId: '7',
    ticker: demoTickers[6],
    title: 'New EV Model Announcement',
    description: 'Mullen Automotive to unveil new electric vehicle prototype at auto show.',
    date: new Date('2024-02-20'),
    category: 'PRODUCT_LAUNCH' as const,
    impactLevel: 'MEDIUM' as const,
    createdAt: new Date()
  },
  {
    id: '4',
    tickerId: '5',
    ticker: demoTickers[4],
    title: 'Debt Restructuring Agreement',
    description: 'AMC reaches agreement with creditors on debt restructuring terms.',
    date: new Date('2024-02-08'),
    category: 'OTHER' as const,
    impactLevel: 'HIGH' as const,
    createdAt: new Date()
  },
  {
    id: '5',
    tickerId: '8',
    ticker: demoTickers[7],
    title: 'New Content Partnership',
    description: 'Genius Brands announces streaming partnership with major platform.',
    date: new Date('2024-02-12'),
    category: 'PARTNERSHIP' as const,
    impactLevel: 'MEDIUM' as const,
    createdAt: new Date()
  }
]

export const demoPriceHistory = [
  { date: '2024-01-01', open: 0.82, high: 0.87, low: 0.80, close: 0.85, volume: 95000000 },
  { date: '2024-01-02', open: 0.85, high: 0.89, low: 0.83, close: 0.87, volume: 102000000 },
  { date: '2024-01-03', open: 0.87, high: 0.91, low: 0.85, close: 0.89, volume: 118000000 },
  { date: '2024-01-04', open: 0.89, high: 0.93, low: 0.87, close: 0.91, volume: 125000000 },
  { date: '2024-01-05', open: 0.91, high: 0.95, low: 0.89, close: 0.93, volume: 135000000 },
  { date: '2024-01-08', open: 0.93, high: 0.97, low: 0.91, close: 0.95, volume: 142000000 },
  { date: '2024-01-09', open: 0.95, high: 0.99, low: 0.93, close: 0.97, volume: 156000000 },
  { date: '2024-01-10', open: 0.97, high: 1.01, low: 0.95, close: 0.99, volume: 168000000 },
  { date: '2024-01-11', open: 0.99, high: 1.03, low: 0.97, close: 1.01, volume: 175000000 },
  { date: '2024-01-12', open: 1.01, high: 1.05, low: 0.99, close: 1.03, volume: 182000000 },
  { date: '2024-01-16', open: 1.03, high: 1.07, low: 1.01, close: 1.05, volume: 195000000 },
  { date: '2024-01-17', open: 1.05, high: 1.09, low: 1.03, close: 1.07, volume: 205000000 },
  { date: '2024-01-18', open: 1.07, high: 1.11, low: 1.05, close: 1.09, volume: 215000000 },
  { date: '2024-01-19', open: 1.09, high: 1.13, low: 1.07, close: 1.11, volume: 225000000 },
  { date: '2024-01-22', open: 1.11, high: 1.15, low: 1.09, close: 1.13, volume: 235000000 },
  { date: '2024-01-23', open: 1.13, high: 1.17, low: 1.11, close: 1.15, volume: 245000000 },
  { date: '2024-01-24', open: 1.15, high: 1.19, low: 1.13, close: 1.17, volume: 255000000 },
  { date: '2024-01-25', open: 1.17, high: 1.21, low: 1.15, close: 1.19, volume: 265000000 },
  { date: '2024-01-26', open: 1.19, high: 1.23, low: 1.17, close: 1.21, volume: 275000000 },
  { date: '2024-01-29', open: 1.21, high: 1.25, low: 1.19, close: 1.23, volume: 285000000 },
]

export const marketOverviewData = {
  totalTickers: 2847,
  gainers: 1245,
  losers: 1356,
  unchanged: 246,
  totalVolume: 15600000000,
  avgChange: 1.23
}