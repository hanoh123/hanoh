import { Metadata } from 'next'
import { NewsManagement } from '@/components/admin/news-management'

export const metadata: Metadata = {
  title: 'News Management - Admin',
  description: 'Manage news articles and deduplication',
}

export default function AdminNewsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">News Management</h1>
        <p className="text-gray-600 mt-2">
          Manage news articles with automatic deduplication
        </p>
      </div>
      
      <NewsManagement />
    </div>
  )
}