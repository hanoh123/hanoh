export interface Ticker {
  id: string
  symbol: string
  name: string
  sector?: string
  exchange?: string
  marketCap?: number
  float?: number
  sharesOutstanding?: number
  currentPrice?: number
  volume?: number
  change24h?: number
  changePercent24h?: number
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

export interface PriceHistory {
  id: string
  tickerId: string
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  createdAt: Date
}

export interface Catalyst {
  id: string
  tickerId: string
  title: string
  description?: string
  date: Date
  category: CatalystCategory
  impactLevel: ImpactLevel
  createdAt: Date
  updatedAt: Date
  ticker?: Ticker
}

export interface User {
  id: string
  email: string
  role: UserRole
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Watchlist {
  id: string
  userId: string
  tickerId: string
  createdAt: Date
  user: User
  ticker: Ticker
}

export interface Alert {
  id: string
  userId: string
  tickerId: string
  type: AlertType
  priceAbove?: number
  priceBelow?: number
  volumeAbove?: number
  changePercent?: number
  isActive: boolean
  lastTriggered?: Date
  createdAt: Date
  updatedAt: Date
  user: User
  ticker: Ticker
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum CatalystCategory {
  EARNINGS = 'EARNINGS',
  FDA_APPROVAL = 'FDA_APPROVAL',
  PARTNERSHIP = 'PARTNERSHIP',
  ACQUISITION = 'ACQUISITION',
  PRODUCT_LAUNCH = 'PRODUCT_LAUNCH',
  CLINICAL_TRIAL = 'CLINICAL_TRIAL',
  REGULATORY = 'REGULATORY',
  INSIDER_BUYING = 'INSIDER_BUYING',
  SHORT_SQUEEZE = 'SHORT_SQUEEZE',
  OTHER = 'OTHER'
}

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertType {
  PRICE_ABOVE = 'PRICE_ABOVE',
  PRICE_BELOW = 'PRICE_BELOW',
  VOLUME_ABOVE = 'VOLUME_ABOVE',
  CHANGE_PERCENT = 'CHANGE_PERCENT'
}

export interface ScreenerFilters {
  minPrice?: number
  maxPrice?: number
  minVolume?: number
  minMarketCap?: number
  maxMarketCap?: number
  sector?: string
  minChange?: number
  maxChange?: number
  sortBy?: 'symbol' | 'price' | 'volume' | 'marketCap' | 'change'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}