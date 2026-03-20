import { cn } from '@/shared/lib/cn';

interface StreamingOutputProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingOutput({ text, isStreaming, className }: StreamingOutputProps) {
  return (
    <span className={cn('font-mono text-sm', className)}>
      {text}
      {isStreaming && (
        <span className="ml-px inline-block h-[0.9em] w-[2px] animate-blink bg-current align-middle" />
      )}
    </span>
  );
}
