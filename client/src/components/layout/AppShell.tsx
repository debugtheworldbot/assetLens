import { ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StatusBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
