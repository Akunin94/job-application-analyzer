import { FileText, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { useResumeStore } from '../hooks/useResumeStore';
import { ResumePreview } from './ResumePreview';

const API_URL = import.meta.env.VITE_API_URL as string;

export function ResumeUploader() {
  const { resumeFileName, setResume, clearResume, hasResume } = useResumeStore();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setPendingFile(file);
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('resume', file);

        const res = await fetch(`${API_URL}/api/upload/resume`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

        const body = (await res.json()) as { text: string; fileName: string };
        setResume(body.text, body.fileName);
        setPendingFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setPendingFile(null);
      } finally {
        setUploading(false);
      }
    },
    [setResume],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleClear = () => {
    setPendingFile(null);
    setError(null);
    clearResume();
  };

  if (hasResume && !uploading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <FileText size={16} className="shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm text-foreground">{resumeFileName}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleClear}>
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {uploading
              ? 'Uploading…'
              : isDragActive
                ? 'Drop your PDF here'
                : 'Drop PDF or click to upload'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">PDF only · max 10 MB</p>
        </div>
      </div>

      {pendingFile && !uploading && <ResumePreview file={pendingFile} />}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
