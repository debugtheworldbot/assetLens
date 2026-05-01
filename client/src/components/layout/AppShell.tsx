import { ReactNode, useEffect } from 'react';
import AppSidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/useMobile';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const fxRefresh = useFxStore((s) => s.refresh);
  const priceRefresh = usePriceStore((s) => s.refresh);

  useEffect(() => {
    fxRefresh();
    priceRefresh();

    const fxInterval = setInterval(fxRefresh, 60 * 60 * 1000);
    const priceInterval = setInterval(priceRefresh, 30 * 60 * 1000);

    let lastFxFetch = Date.now();
    let lastPriceFetch = Date.now();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFxFetch > 15 * 60 * 1000) {
          fxRefresh();
          lastFxFetch = now;
        }
        if (now - lastPriceFetch > 10 * 60 * 1000) {
          priceRefresh();
          lastPriceFetch = now;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(fxInterval);
      clearInterval(priceInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          {isMobile && <SidebarTrigger className="-ml-1" />}
          {isMobile && <Separator orientation="vertical" className="mr-2 h-4" />}
          <StatusBar />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
