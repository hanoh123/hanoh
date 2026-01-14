import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { CatalystManagement } from '@/components/admin/catalyst-management'

export const metadata: Metadata = {
  title: 'Catalyst Management',
  description: 'Manage catalyst events and market-moving announcements',
}

export default async function AdminCatalystsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catalyst Management</h1>
        <p className="text-gray-600 mt-2">
          Manage upcoming events, announcements, and market catalysts
        </p>
      </div>

      <CatalystManagement />
    </div>
  )
}