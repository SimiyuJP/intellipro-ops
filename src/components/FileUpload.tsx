import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  preview?: string;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  compact?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽';
  return '📎';
}

export function FileUpload({
  onFilesChange,
  files,
  compact = false,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md',
  maxFiles = 10,
  maxSizeMB = 20,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = [];
    const remaining = maxFiles - files.length;

    for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
      const file = fileList[i];
      if (file.size > maxSizeMB * 1024 * 1024) continue;

      const uploaded: UploadedFile = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
      };

      if (file.type.startsWith('image/')) {
        uploaded.preview = URL.createObjectURL(file);
      }

      newFiles.push(uploaded);
    }

    onFilesChange([...files, ...newFiles]);
  }, [files, maxFiles, maxSizeMB, onFilesChange]);

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.preview) URL.revokeObjectURL(file.preview);
    onFilesChange(files.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={e => processFiles(e.target.files)} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="command-input px-3 py-2 text-xs hover:border-primary/50 hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <span>📎</span> Attach
        </button>
        <AnimatePresence>
          {files.map(f => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 bg-secondary/50 border border-border rounded px-2 py-1 text-xs"
            >
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="w-5 h-5 rounded object-cover" />
              ) : (
                <span>{getFileIcon(f.type)}</span>
              )}
              <span className="max-w-[100px] truncate">{f.name}</span>
              <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-foreground ml-0.5">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={e => processFiles(e.target.files)} />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-secondary/30'
        }`}
      >
        <div className="text-2xl mb-2">📁</div>
        <p className="text-sm text-muted-foreground">
          Drop files here or <span className="text-primary underline">browse</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Images, PDFs, docs — max {maxSizeMB}MB each, up to {maxFiles} files
        </p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
            {files.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 bg-secondary/30 border border-border/50 rounded-lg p-2.5"
              >
                {f.preview ? (
                  <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-lg">
                    {getFileIcon(f.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.size}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                  className="text-muted-foreground hover:text-health-red transition-colors text-sm px-1"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
