'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Inbox as InboxIcon,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Play,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { getInboxContents, processInbox } from '@/lib/api'
import { formatDistanceToNow, formatFileSize } from '@/lib/format'
import type { InboxContentsResponse, InboxFileInfo, InboxFolderInfo } from '@/lib/types'

interface FileNodeProps {
  file: InboxFileInfo
}

function FileNode({ file }: FileNodeProps) {
  const modifiedDate = new Date(file.modified)

  return (
    <div className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{file.name}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span>{formatFileSize(file.size_bytes)}</span>
        <span className="hidden sm:inline">{formatDistanceToNow(modifiedDate)}</span>
      </div>
    </div>
  )
}

interface FolderNodeProps {
  folder: InboxFolderInfo
  level?: number
}

function FolderNode({ folder, level = 0 }: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const hasContents = folder.files.length > 0 || folder.folders.length > 0
  const totalItems = folder.files.length + folder.folders.length

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors text-left"
        disabled={!hasContents}
      >
        {hasContents ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-amber-500 shrink-0" />
        )}
        <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
        {hasContents && (
          <span className="text-xs text-muted-foreground">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </button>
      {isExpanded && hasContents && (
        <div className="ml-6 border-l border-border pl-2">
          {folder.folders.map((subfolder) => (
            <FolderNode key={subfolder.path} folder={subfolder} level={level + 1} />
          ))}
          {folder.files.map((file) => (
            <FileNode key={file.path} file={file} />
          ))}
        </div>
      )}
    </div>
  )
}

export function InboxFileBrowser() {
  const [data, setData] = useState<InboxContentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<string | null>(null)

  const fetchContents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const contents = await getInboxContents()
      setData(contents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox contents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const handleProcess = async () => {
    setProcessing(true)
    setProcessResult(null)
    try {
      const result = await processInbox()
      setProcessResult(`Processed ${result.processed_count} file(s)`)
      // Refresh the contents after processing
      await fetchContents()
    } catch (err) {
      setProcessResult(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading inbox contents...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Inbox</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchContents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const isEmpty = data.total_files === 0 && data.total_folders === 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InboxIcon className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle className="text-xl">Inbox</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {data.total_files} file{data.total_files !== 1 ? 's' : ''} • {data.total_folders} folder{data.total_folders !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchContents}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {data.root_files.length > 0 && (
                <Button
                  onClick={handleProcess}
                  size="sm"
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Process Inbox
                </Button>
              )}
            </div>
          </div>
          {processResult && (
            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
              {processResult}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* File Tree */}
      {isEmpty ? (
        <Card>
          <CardContent className="p-12 text-center">
            <InboxIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Inbox is empty</h2>
            <p className="text-muted-foreground">
              All caught up! New items will appear here when they&apos;re added to your inbox.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              {/* Root-level folders */}
              {data.folders.map((folder) => (
                <FolderNode key={folder.path} folder={folder} />
              ))}
              {/* Root-level files */}
              {data.root_files.map((file) => (
                <FileNode key={file.path} file={file} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
