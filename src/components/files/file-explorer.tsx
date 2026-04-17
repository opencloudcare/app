import React, {useEffect, useMemo, useState} from 'react'
import {
  IconAlertTriangle,
  IconEye,
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFolder,
  IconHome,
  IconLoader2,
  IconPhoto,
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
import type {User} from "better-auth";

interface S3Object {
  Key: string
  Size: number
  LastModified: string
}

interface FileEntry {
  name: string
  fullKey: string
  type: 'file' | 'folder'
  size?: number
  lastModified?: string
  fileType?: 'image' | 'pdf' | 'doc' | 'other'
}

function detectFileType(name: string): FileEntry['fileType'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'doc'
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
  const [showUpload, setShowUpload] = useState(false)
  const [uploadSubfolder, setUploadSubfolder] = useState("")
  const [uploadQueue, setUploadQueue] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set())
  const [previewing, setPreviewing] = useState<Set<string>>(new Set())
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

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
    if (user) fetchFileList()
  }, [user])


  const fetchFileList = () => {
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
  }

  const uploadFile = async (file: File) => {
    const normalizedPrefix = currentPath === '/'
      ? userPrefix
      : currentPath.startsWith('/') ? currentPath.slice(1) : currentPath
    const subfolder = uploadSubfolder.trim().replace(/\/+$/, '')
    const key = subfolder
      ? `${normalizedPrefix}${subfolder}/${file.name}`
      : `${normalizedPrefix}${file.name}`
    const {data: url} = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/storage/upload?key=${encodeURIComponent(key)}`,
      {credentials: 'include'}
    ).then(res => res.json())

    if (!url) return

    await fetch(url, {method: 'PUT', body: file, headers: {'Content-Type': file.type}})
  }

  const handleUploadAll = async () => {
    if (uploadQueue.length === 0) return
    setUploading(true)
    for (const file of uploadQueue) {
      await uploadFile(file)
    }
    setUploading(false)
    setUploadQueue([])
    setUploadSubfolder("")
    setShowUpload(false)
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

  return (
    <div className="flex flex-col flex-1 px-6 pb-6 gap-4 max-h-[calc(100vh-40px)]">

      {/* Breadcrumb + Upload button */}
      <div className="flex items-center justify-between pt-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => setCurrentPath("/")}
                className="flex items-center gap-1 cursor-pointer"
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
                      className="cursor-pointer"
                    >
                      {crumb}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpload(v => !v)}
        >
          <IconUpload size={14}/>
          Upload
        </Button>
      </div>

      {/* Upload area */}
      {showUpload && (
        <div className="flex flex-col gap-3 p-5 rounded-xl border border-dashed bg-muted/20">
          {/* Destination row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">
              {displayPath ? `/${displayPath}` : '/'}
            </span>
            <Input
              value={uploadSubfolder}
              onChange={(e) => setUploadSubfolder(e.target.value)}
              placeholder="subfolder (optional)"
              className="h-7 text-xs"
            />
          </div>

          <div className="flex items-start gap-4">
            <InputFile onFilesSelect={setUploadQueue}/>

            {/* Queued file list */}
            {uploadQueue.length > 0 && (
              <div className="flex flex-col flex-1 gap-1 min-w-0">
                <span
                  className="text-xs text-muted-foreground mb-1">{uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''} queued</span>
                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                  {uploadQueue.map((f, i) => (
                    <div key={i}
                         className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-muted/50 text-xs">
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
                <Button
                  size="sm"
                  className="mt-1"
                  onClick={handleUploadAll}
                  disabled={uploading}
                >
                  {uploading
                    ? <><IconLoader2 size={14} className="animate-spin"/> Uploading...</>
                    : <><IconUpload size={14}/> Upload {uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''}</>
                  }
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

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
                className="grid grid-cols-[1fr_90px_100px_72px] px-4 py-2.5 items-center hover:bg-muted/30 transition-colors group border-b border-border/50 last:border-0"
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {entry.type === 'folder'
                    ? <IconFolder size={18} className="shrink-0 text-amber-400"/>
                    : <FileTypeIcon type={entry.fileType}/>
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
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20">
                    <IconAlertTriangle size={32} className="text-amber-400"/>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <p className="text-sm font-medium text-foreground">Preview not available</p>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      Word documents can't be previewed in the browser. Download the file to open it in a compatible application.
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