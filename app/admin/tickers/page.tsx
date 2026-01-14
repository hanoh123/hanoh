import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { TickerManagement } from '@/components/admin/ticker-management'

export const metadata: Metadata = {
  title: 'Ticker Management',
  description: 'Manage stock tickers and company information',
}

export default async function AdminTickersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ticker Management</h1>
        <p className="text-gray-600 mt-2">
          Manage stock symbols, company information, and market data
        </p>
      </div>

      <TickerManagement />
    </div>
  )
}