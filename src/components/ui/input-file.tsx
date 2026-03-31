import React, {useRef, useState} from 'react'
import {IconUpload, IconPhoto, IconX, IconFile, IconFileTypePdf, IconFileTypeDocx} from "@tabler/icons-react";

interface InputFileProps {
  onFilesSelect: (files: File[]) => void
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext))
    return <IconPhoto size={24} className="text-blue-400" />
  if (ext === 'pdf')
    return <IconFileTypePdf size={24} className="text-red-500" />
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext))
    return <IconFileTypeDocx size={24} className="text-blue-600" />
  return <IconFile size={24} className="text-muted-foreground" />
}

export const InputFile = ({onFilesSelect}: InputFileProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)

  const addFiles = (incoming: FileList) => {
    const newFiles = Array.from(incoming)
    setSelectedFiles(prev => {
      const merged = [...prev, ...newFiles.filter(f => !prev.some(p => p.name === f.name))]
      onFilesSelect(merged)
      return merged
    })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) addFiles(event.target.files)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFiles([])
    onFilesSelect([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-2
        w-72 h-36 rounded-xl border-2 border-dashed cursor-pointer
        transition-colors duration-200 select-none
        ${dragging
          ? 'border-foreground bg-muted'
          : 'border-border hover:border-foreground/40 hover:bg-muted/50'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.odt,.rtf,.txt,.csv"
        multiple
      />

      {selectedFiles.length > 0 ? (
        <>
          {selectedFiles.length === 1
            ? getFileIcon(selectedFiles[0].name)
            : <IconUpload size={24} className="text-muted-foreground" />
          }
          <span className="text-sm font-medium text-foreground max-w-50 truncate">
            {selectedFiles.length === 1
              ? selectedFiles[0].name
              : `${selectedFiles.length} files selected`
            }
          </span>
          <span className="text-xs text-muted-foreground">Click to add more</span>
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX size={16} />
          </button>
        </>
      ) : (
        <>
          <IconUpload size={24} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Upload files</span>
          <span className="text-xs text-muted-foreground">Click or drag & drop</span>
        </>
      )}
    </div>
  )
}