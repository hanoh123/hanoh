import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ImportManagement from '@/components/admin/import-management'

export const metadata: Metadata = {
  title: 'Import Management - Admin',
  description: 'Manage CSV imports and data ingestion'
}

export default async function AdminImportsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage price history CSV files
        </p>
      </div>

      <ImportManagement />
    </div>
  )
}