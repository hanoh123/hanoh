'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Download, Eye, RefreshCw } from 'lucide-react'

interface ImportJob {
  id: string
  type: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SUCCESS_WITH_ERRORS'
  fileName: string | null
  fileSizeBytes: number | null
  totalRows: number | null
  successRows: number | null
  failedRows: number | null
  startedAt: string
  finishedAt: string | null
  createdBy: string | null
  duration: number | null
}

interface ImportJobDetail extends ImportJob {
  errorSample: any[] | null
  errorFileUrl: string | null
  successRate: number | null
}

export default function ImportManagement() {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tickerId, setTickerId] = useState<string>('')
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [selectedJob, setSelectedJob] = useState<ImportJobDetail | null>(null)
  const [jobDetailLoading, setJobDetailLoading] = useState(false)

  // Pagination and filtering
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    fetchJobs()
  }, [page, statusFilter, typeFilter])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/admin/imports?${params}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs)
      } else {
        console.error('Failed to fetch jobs:', data.error)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setUploadResult(null)

      const formData = new FormData()
      formData.append('file', selectedFile)
      if (tickerId) {
        formData.append('tickerId', tickerId)
      }

      const response = await fetch('/api/admin/imports/price-history', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setUploadResult(result)

      if (result.success) {
        // Refresh jobs list
        fetchJobs()
        // Clear form
        setSelectedFile(null)
        setTickerId('')
      }
    } catch (error: any) {
      setUploadResult({ success: false, error: error.message })
    } finally {
      setUploading(false)
    }
  }

  const fetchJobDetails = async (jobId: string) => {
    try {
      setJobDetailLoading(true)
      const response = await fetch(`/api/admin/imports/${jobId}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedJob(data)
      } else {
        console.error('Failed to fetch job details:', data.error)
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
    } finally {
      setJobDetailLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'outline',
      RUNNING: 'secondary',
      COMPLETED: 'default',
      FAILED: 'destructive',
      SUCCESS_WITH_ERRORS: 'secondary'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    return `${kb.toFixed(1)} KB`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Price History CSV
          </CardTitle>
          <CardDescription>
            Upload CSV files with price history data. Supports both single-ticker and multi-ticker formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="file">CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: Single-ticker (date,open,high,low,close,volume) or Multi-ticker (symbol,date,open,high,low,close,volume)
              </p>
            </div>
            <div>
              <Label htmlFor="tickerId">Ticker ID (Optional)</Label>
              <Input
                id="tickerId"
                placeholder="Leave empty for multi-ticker CSV"
                value={tickerId}
                onChange={(e) => setTickerId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Required for single-ticker CSV, ignored for multi-ticker CSV
              </p>
            </div>
          </div>

          <Button 
            onClick={handleFileUpload} 
            disabled={!selectedFile || uploading}
            className="w-full md:w-auto"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </>
            )}
          </Button>

          {uploadResult && (
            <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {uploadResult.success ? (
                  <div>
                    <p className="font-medium text-green-800">Upload successful!</p>
                    <p className="text-green-700">
                      Processed {uploadResult.successRows} of {uploadResult.totalRows} rows
                      {uploadResult.failedRows > 0 && ` (${uploadResult.failedRows} failed)`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-800">Upload failed</p>
                    <p className="text-red-700">{uploadResult.error || uploadResult.message}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Jobs
          </CardTitle>
          <CardDescription>
            View and manage price history import jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="SUCCESS_WITH_ERRORS">Success with Errors</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="PRICE_HISTORY_CSV">Price History CSV</SelectItem>
                <SelectItem value="PRICE_HISTORY_API">Price History API</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Jobs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading jobs...
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No import jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {job.fileName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(job.status)}
                      </TableCell>
                      <TableCell>
                        {job.totalRows ? (
                          <div className="text-sm">
                            <div>{job.successRows || 0} success</div>
                            {job.failedRows ? (
                              <div className="text-red-600">{job.failedRows} failed</div>
                            ) : null}
                          </div>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{formatFileSize(job.fileSizeBytes)}</TableCell>
                      <TableCell>{formatDuration(job.duration)}</TableCell>
                      <TableCell>
                        {new Date(job.startedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => fetchJobDetails(job.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Import Job Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about import job {job.id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {jobDetailLoading ? (
                              <div className="py-8 text-center">Loading details...</div>
                            ) : selectedJob ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                                  </div>
                                  <div>
                                    <Label>Success Rate</Label>
                                    <div className="mt-1">
                                      {selectedJob.successRate !== null ? `${selectedJob.successRate}%` : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Total Rows</Label>
                                    <div className="mt-1">{selectedJob.totalRows || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <Label>Duration</Label>
                                    <div className="mt-1">{formatDuration(selectedJob.duration)}</div>
                                  </div>
                                </div>

                                {selectedJob.errorSample && selectedJob.errorSample.length > 0 && (
                                  <div>
                                    <Label>Error Sample</Label>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm">
                                      <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(selectedJob.errorSample, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}