import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/shared/lib/cn';
import { useResumeStore } from '../hooks/useResumeStore';
import { ResumePreview } from './ResumePreview';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Props {
  /** Slimmer dropzone for when the version list above already carries the weight. */
  compact?: boolean;
}

export function ResumeUploader({ compact = false }: Props) {
  const { addResume } = useResumeStore();
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
        addResume(body.text, body.fileName);
        setPendingFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setPendingFile(null);
      } finally {
        setUploading(false);
      }
    },
    [addResume],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors',
          compact ? 'p-4' : 'p-8',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />
        {!compact && <Upload size={24} className="text-muted-foreground" />}
        <div>
          <p className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
            {uploading
              ? 'Uploading…'
              : isDragActive
                ? 'Drop your PDF here'
                : compact
                  ? 'Add another version'
                  : 'Drop PDF or click to upload'}
          </p>
          {!compact && <p className="mt-0.5 text-xs text-muted-foreground">PDF only · max 10 MB</p>}
        </div>
      </div>

      {pendingFile && !uploading && <ResumePreview file={pendingFile} />}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
