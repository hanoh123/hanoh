import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { UserWatchlist } from '@/components/user/user-watchlist'
import { UserAlerts } from '@/components/user/user-alerts'
import { UserStats } from '@/components/user/user-stats'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personal penny stocks dashboard',
}

export default async function UserDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {session.user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <UserWatchlist userId={session.user.id} />
          <UserAlerts userId={session.user.id} />
        </div>
        
        <div>
          <UserStats userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}