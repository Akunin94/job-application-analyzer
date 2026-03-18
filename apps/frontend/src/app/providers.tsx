import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/shared/lib/query-client';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(222 14% 11%)',
            color: 'hsl(213 31% 91%)',
            border: '1px solid hsl(216 12% 18%)',
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
