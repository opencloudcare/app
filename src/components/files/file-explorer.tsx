import React, {useEffect, useMemo, useRef, useState} from 'react'
import {
  IconAlertTriangle,
  IconEye,
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFolder,
  IconFolderPlus,
  IconHome,
  IconLoader2,
  IconPhoto,
  IconReload,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import {InputFile} from "@/components/ui/input-file.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import type {User} from "better-auth";
import {toast} from "sonner";
import {renderToStaticMarkup} from "react-dom/server";

interface S3Object {
  Key: string
  Size: number
  LastModified: string
}

export interface FileEntry {
  name: string
  fullKey: string
  type: 'file' | 'folder'
  size?: number
  lastModified?: string
  fileType?: 'image' | 'pdf' | 'doc' | 'other'
}

export function detectFileType(name: string): FileEntry['fileType'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'tif', 'pnm', 'pgm', 'pbm', 'ppm', 'pam', 'jxr', 'jp2', 'jpx', 'psd', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['epub', 'mobi', 'fb2', 'cbz', 'xps', 'txt'].includes(ext)) return 'doc'
  return 'other'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
}


function FileTypeIcon({type, size = 18}: { type: FileEntry['fileType'], size?: number }) {
  switch (type) {
    case 'image':
      return <IconPhoto size={size} className="shrink-0 text-blue-400"/>
    case 'pdf':
      return <IconFileTypePdf size={size} className="shrink-0 text-red-500"/>
    case 'doc':
      return <IconFileTypeDocx size={size} className="shrink-0 text-blue-600"/>
    default:
      return <IconFile size={size} className="shrink-0 text-muted-foreground"/>
  }
}

export function FileExplorer() {
  const [storageList, setStorageList] = useState<S3Object[]>([])
  const [fileListLoading, setFileListLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState<string>("/")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set())
  const [previewing, setPreviewing] = useState<Set<string>>(new Set())
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [dragOverBreadcrumb, setDragOverBreadcrumb] = useState<'home' | number | null>(null)
  const [movingKeys, setMovingKeys] = useState<Set<string>>(new Set())
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  const userPrefix = user ? `${user.id}/documents/` : ''

  const displayPath = currentPath === '/' // strip the userId prefix so it never appears in the breadcrumb trail
    ? ''
    : currentPath.startsWith(userPrefix)
      ? currentPath.slice(userPrefix.length)
      : currentPath

  const breadcrumbs = displayPath ? displayPath.slice(0, -1).split('/').filter(Boolean) : []


  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {credentials: "include"})
      .then(res => res.json())
      .then(data => setUser(data.user))
  }, [])

  useEffect(() => {
    if (showNewFolder) setTimeout(() => newFolderInputRef.current?.focus(), 0)
  }, [showNewFolder])

  useEffect(() => {
    if (user) fetchFileList()
  }, [user])


  const fetchFileList = () => {
    console.log("GETTING THE LIST")
    setFileListLoading(true)
    if (!user) return
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/storage/list/${encodeURIComponent(user.id)}`, {credentials: 'include'})
      .then(res => res.json())
      .then(result => {
        setStorageList(result.data ?? [])
        setFileListLoading(false)
      })
      .catch(() => setFileListLoading(false))
  }

  const navigateToCrumb = (index: number) => {
    const parts = breadcrumbs.slice(0, index + 1)
    setCurrentPath(userPrefix + parts.join('/') + '/')
  }

  const handlePreview = async (entry: FileEntry) => {
    setPreviewing(prev => new Set(prev).add(entry.fullKey))
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/storage/get?key=${encodeURIComponent(entry.fullKey)}`,
        {credentials: 'include'}
      )
      const {data: url} = await res.json()
      if (entry.fileType === 'image' || entry.fileType === 'pdf') {
        setPreviewEntry(entry)
        setPreviewUrl(url)
      } else {
        console.error(`.${entry.fileType} files currently not supported for preview.`)
        setPreviewEntry(entry)
        setPreviewUrl(url)
        // window.open(url, '_blank')
      }
    } finally {
      setPreviewing(prev => {
        const next = new Set(prev)
        next.delete(entry.fullKey)
        return next
      })
    }
  }

  const closePreview = () => {
    setPreviewEntry(null)
    setPreviewUrl(null)
  }

  const handleDelete = (entry: FileEntry) => {
    setDeletedKeys(prev => new Set(prev).add(entry.fullKey))
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/storage/delete/${encodeURIComponent(entry.fullKey)}`, {
      method: 'DELETE',
      credentials: 'include'
    })
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim().replace(/\/+/g, '')
    if (!name || !user) return
    const normalizedPrefix = currentPath === '/'
      ? userPrefix
      : currentPath.startsWith('/') ? currentPath.slice(1) : currentPath
    const key = `${normalizedPrefix}${name}/`
    setCreatingFolder(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/storage/folder`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({key}),
      })
      if (!res.ok) toast.error("Failed to create folder")
      else {
        setNewFolderName("")
        setShowNewFolder(false)
        fetchFileList()
      }
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDrop = async (targetFolder: FileEntry, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverKey(null)
    const raw = e.dataTransfer.getData('application/x-opencare-s3file')
    if (!raw) return
    const entry: FileEntry = JSON.parse(raw)
    const destKey = `${targetFolder.fullKey}${entry.name}`
    if (destKey === entry.fullKey) return
    setMovingKeys(prev => new Set(prev).add(entry.fullKey))
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/storage/move`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sourceKey: entry.fullKey, destKey}),
      })
      if (!res.ok) {
        const error = await res.json()
        toast.error(error.message ?? "Failed to move file")
      } else {
        setDeletedKeys(prev => new Set(prev).add(entry.fullKey))
        fetchFileList()
      }
    } finally {
      setMovingKeys(prev => {
        const next = new Set(prev)
        next.delete(entry.fullKey)
        return next
      })
    }
  }

  const handleDropOnBreadcrumb = async (crumbIndex: 'home' | number, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverBreadcrumb(null)
    const raw = e.dataTransfer.getData('application/x-opencare-s3file')
    if (!raw) return
    const entry: FileEntry = JSON.parse(raw)
    const targetFolder = crumbIndex === 'home'
      ? userPrefix
      : userPrefix + breadcrumbs.slice(0, (crumbIndex as number) + 1).join('/') + '/'
    const destKey = `${targetFolder}${entry.name}`
    if (destKey === entry.fullKey) return
    setMovingKeys(prev => new Set(prev).add(entry.fullKey))
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/storage/move`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sourceKey: entry.fullKey, destKey}),
      })
      if (!res.ok) {
        toast.error("Failed to move file")
      } else {
        setDeletedKeys(prev => new Set(prev).add(entry.fullKey))
        fetchFileList()
      }
    } finally {
      setMovingKeys(prev => {
        const next = new Set(prev)
        next.delete(entry.fullKey)
        return next
      })
    }
  }

  const uploadFile = async (file: File) => {
    const normalizedPrefix = currentPath === '/'
      ? userPrefix
      : currentPath.startsWith('/') ? currentPath.slice(1) : currentPath
    const key = `${normalizedPrefix}${file.name}`
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/storage/upload?key=${encodeURIComponent(key)}`,
      {
        credentials: 'include',
        method: 'PUT',
        headers: {'Content-Type': file.type},
        body: file
      }
    )
    if (!response.ok) {
      const error = await response.json()
      toast.error(error.message ??  "Failed to upload file")
    }
  }

  const handleUploadAll = async () => {
    if (uploadQueue.length === 0) return
    setUploading(true)
    for (const file of uploadQueue) {
      await uploadFile(file)
    }
    setUploading(false)
    setUploadQueue([])
    setUploadDialogOpen(false)
    fetchFileList()
  }

  const parseEntries = (objects: S3Object[], prefix: string): FileEntry[] => {
    const folders = new Set<string>()
    const files: FileEntry[] = []
    prefix = prefix === '/' && user ? userPrefix : prefix

    // Normalize: strip any leading slash so it always matches raw S3 keys
    const normalizedPrefix = prefix.startsWith('/') ? prefix.slice(1) : prefix

    for (const obj of objects) {
      // Strip the current prefix to get the path relative to this folder
      if (!obj.Key.startsWith(normalizedPrefix)) continue
      const relative = obj.Key.slice(normalizedPrefix.length)
      if (!relative) continue

      const slashIdx = relative.indexOf('/')
      if (slashIdx !== -1) {
        // Key lives deeper — record the immediate child folder name
        folders.add(relative.slice(0, slashIdx))
      } else {
        files.push({
          name: relative,
          fullKey: obj.Key,
          type: 'file',
          size: obj.Size,
          lastModified: obj.LastModified,
          fileType: detectFileType(relative),
        })
      }
    }

    const folderEntries: FileEntry[] = Array.from(folders).sort().map(f => ({
      name: f,
      fullKey: `${normalizedPrefix}${f}/`,
      type: 'folder' as const,
    }))

    return [...folderEntries, ...files.sort((a, b) => a.name.localeCompare(b.name))]
  }

  const entries = useMemo(() => {
    const visible = storageList.filter(obj => !deletedKeys.has(obj.Key))
    return parseEntries(visible, currentPath)
  }, [storageList, currentPath, deletedKeys])

  const currentFolderLabel = displayPath ? `/${displayPath}` : '/'

  return (
    <div className="flex flex-col flex-1 px-6 pb-6 gap-4 max-h-[calc(100vh-40px)]">

      {/* Breadcrumb + toolbar */}
      <div className="flex items-center justify-between pt-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => setCurrentPath("/")}
                onDragOver={e => { e.preventDefault(); setDragOverBreadcrumb('home') }}
                onDragLeave={() => setDragOverBreadcrumb(null)}
                onDrop={e => handleDropOnBreadcrumb('home', e)}
                className={`flex items-center gap-1 cursor-pointer rounded px-1 transition-colors ${dragOverBreadcrumb === 'home' ? 'bg-amber-400/20 text-amber-500' : ''}`}
              >
                <IconHome size={14}/>
                Files
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <BreadcrumbSeparator/>
                <BreadcrumbItem>
                  {i === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => navigateToCrumb(i)}
                      onDragOver={e => { e.preventDefault(); setDragOverBreadcrumb(i) }}
                      onDragLeave={() => setDragOverBreadcrumb(null)}
                      onDrop={e => handleDropOnBreadcrumb(i, e)}
                      className={`cursor-pointer rounded px-1 transition-colors ${dragOverBreadcrumb === i ? 'bg-amber-400/20 text-amber-500' : ''}`}
                    >
                      {crumb}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <TooltipProvider delayDuration={600}>
          <div className="inline-flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={fetchFileList} disabled={fileListLoading}>
                  {fileListLoading
                    ? <IconLoader2 size={15} className="animate-spin"/>
                    : <IconReload size={15}/>
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Refresh</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setNewFolderDialogOpen(true)}>
                  <IconFolderPlus size={15}/>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">New folder</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setUploadDialogOpen(true)}>
                  <IconUpload size={15}/>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Upload files</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* File table */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border">

        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_90px_100px_72px] px-4 py-2 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground sticky top-0 z-10">
          <span>Name</span>
          <span>Size</span>
          <span>Modified</span>
          <span/>
        </div>

        {fileListLoading ? (
          <div className="flex flex-col gap-px p-3">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-muted animate-pulse"/>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2 text-muted-foreground">
            <IconFolder size={44} className="opacity-20"/>
            <p className="text-sm">This folder is empty</p>
          </div>
        ) : (
          <div>
            {entries.map(entry => (
              <div
                key={entry.fullKey}
                className={`grid grid-cols-[1fr_90px_100px_72px] px-4 py-2.5 items-center hover:bg-muted/30 transition-colors group border-b border-border/50 last:border-0
                  ${entry.type === 'file' ? (movingKeys.has(entry.fullKey) ? 'opacity-40 pointer-events-none' : 'cursor-grab active:cursor-grabbing active:opacity-60') : ''}
                  ${entry.type === 'folder' && dragOverKey === entry.fullKey ? 'bg-amber-400/10 ring-1 ring-inset ring-amber-400/40' : ''}`}
                draggable={entry.type === 'file'}
                onDragOver={entry.type === 'folder' ? (e) => { e.preventDefault(); setDragOverKey(entry.fullKey) } : undefined}
                onDragLeave={entry.type === 'folder' ? () => setDragOverKey(null) : undefined}
                onDrop={entry.type === 'folder' ? (e) => handleDrop(entry, e) : undefined}
                onDragStart={entry.type === 'file' ? (e) => {
                  const item = document.createElement('div')
                  const iconHTML = renderToStaticMarkup(<FileTypeIcon type={entry.fileType} />)
                  item.innerHTML = `${iconHTML} <span>${entry.name}</span>`
                  item.style.cssText = `
                       position: absolute; 
                       top: -1000px;                                                 
                       display: flex; 
                       align-items: center; 
                       gap: 6px;                                     
                       padding: 6px 10px; 
                       border-radius: 8px;
                       background: hsl(var(--background));                                               
                       border: 1px solid hsl(var(--border));
                       font-size: 12px; 
                       color: hsl(var(--foreground));                                   
                       box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                       `
                  document.body.appendChild(item)
                  e.dataTransfer.setDragImage(item, 12, 24)
                  setTimeout(() => document.body.removeChild(item), 0)

                  e.dataTransfer.setData('application/x-opencare-s3file', JSON.stringify(entry))
                  e.dataTransfer.effectAllowed = 'copy'
                } : undefined}
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {entry.type === 'folder'
                    ? <IconFolder size={18} className="shrink-0 text-amber-400"/>
                    : <FileTypeIcon type={entry.fileType}
                    />
                  }
                  {entry.type === 'folder' ? (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setCurrentPath(entry.fullKey)
                      }}
                      className="text-sm font-medium truncate hover:underline text-left p-0"
                    >
                      {entry.name}
                    </Button>
                  ) : (
                    <button onClick={() => handlePreview(entry)}
                            className="cursor-pointer hover:underline text-sm truncate">{entry.name}</button>
                  )}
                </div>

                {/* Size */}
                <span className="text-xs text-muted-foreground">
                  {entry.size !== undefined ? formatSize(entry.size) : '—'}
                </span>

                {/* Modified */}
                <span className="text-xs text-muted-foreground">
                  {entry.lastModified ? formatDate(entry.lastModified) : '—'}
                </span>

                {/* Actions */}
                <div
                  className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  {entry.type === 'file' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handlePreview(entry)}
                        disabled={previewing.has(entry.fullKey)}
                      >
                        {previewing.has(entry.fullKey)
                          ? <IconLoader2 size={14} className="animate-spin"/>
                          : <IconEye size={14}/>
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(entry)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <IconTrash size={14}/>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {!fileListLoading && (
        <p className="text-xs text-muted-foreground text-right -mt-2">
          {entries.filter(e => e.type === 'file').length} file{entries.filter(e => e.type === 'file').length !== 1 ? 's' : ''},&nbsp;
          {entries.filter(e => e.type === 'folder').length} folder{entries.filter(e => e.type === 'folder').length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Upload dialog */}
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) setUploadQueue([])
          setUploadDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              Files will be added to <span className="font-medium text-foreground">{currentFolderLabel}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <InputFile className="w-full" onFilesSelect={setUploadQueue}/>

            {uploadQueue.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''} queued
                </span>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {uploadQueue.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 text-xs">
                      <span className="truncate">{f.name}</span>
                      <button
                        onClick={() => setUploadQueue(prev => prev.filter((_, j) => j !== i))}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <IconX size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={handleUploadAll} disabled={uploading || uploadQueue.length === 0}>
              {uploading
                ? <><IconLoader2 size={14} className="animate-spin"/> Uploading…</>
                : <><IconUpload size={14}/> Upload {uploadQueue.length > 0 ? `${uploadQueue.length} file${uploadQueue.length !== 1 ? 's' : ''}` : 'files'}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog
        open={newFolderDialogOpen}
        onOpenChange={(open) => {
          if (!open) setNewFolderName("")
          setNewFolderDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Inside <span className="font-medium text-foreground">{currentFolderLabel}</span>
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') setNewFolderDialogOpen(false)
            }}
            placeholder="Folder name"
          />

          <DialogFooter showCloseButton>
            <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder
                ? <><IconLoader2 size={14} className="animate-spin"/> Creating…</>
                : 'Create folder'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      {previewEntry && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="relative bg-background rounded-xl shadow-xl overflow-hidden max-w-4xl w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileTypeIcon type={previewEntry.fileType} size={16}/>
                <span className="text-sm font-medium truncate max-w-sm">{previewEntry.name}</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={closePreview}>
                <IconX size={16}/>
              </Button>
            </div>

            {/* Modal content */}
            <div className="max-h-[75vh] overflow-auto">
              {previewEntry.fileType === 'image' ? (
                <img
                  src={previewUrl}
                  alt={previewEntry.name}
                  className="w-full h-auto object-contain"
                />
              ) : previewEntry.fileType === 'pdf' ? (
                <iframe
                  src={previewUrl}
                  title={previewEntry.name}
                  className="w-full h-[75vh]"
                />
              ) : (
                <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-4 px-8 py-10">
                  <div
                    className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20">
                    <IconAlertTriangle size={32} className="text-amber-400"/>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <p className="text-sm font-medium text-foreground">Preview not available</p>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      Word documents can't be previewed in the browser. Download the file to open it in a compatible
                      application.
                    </p>
                  </div>
                  <a
                    href={previewUrl}
                    download={previewEntry.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                  >
                    <IconFileTypeDocx size={14} className="text-blue-600"/>
                    Download {previewEntry.name}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}