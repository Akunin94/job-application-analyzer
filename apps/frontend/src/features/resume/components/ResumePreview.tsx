import * as pdfjsLib from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface ResumePreviewProps {
  file: File;
}

export function ResumePreview({ file }: ResumePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (cancelled) return;
        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = canvas.parentElement?.clientWidth ?? 400;
        const scale = Math.min(containerWidth / viewport.width, 1.5);
        const scaled = page.getViewport({ scale });

        canvas.width = scaled.width;
        canvas.height = scaled.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;
      } catch {
        if (!cancelled) setError('Could not render preview');
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (error) {
    return <p className="text-xs text-muted-foreground">{error}</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted/30">
      <div className="border-b border-border px-3 py-1.5">
        <p className="text-xs text-muted-foreground">
          {file.name}
          {pageCount > 0 && ` · ${pageCount} page${pageCount === 1 ? '' : 's'}`}
        </p>
      </div>
      <div className="overflow-auto p-2">
        <canvas ref={canvasRef} className="mx-auto max-w-full" />
      </div>
    </div>
  );
}
