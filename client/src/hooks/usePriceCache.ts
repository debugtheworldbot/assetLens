import { useMemo } from 'react';
import { usePriceStore } from '@/store/usePriceStore';
import { PriceCache } from '@/lib/types';

export function usePriceCache(): PriceCache {
  const prices = usePriceStore((s) => s.prices);
  const fetchedAt = usePriceStore((s) => s.fetchedAt);
  const status = usePriceStore((s) => s.status);
  const errors = usePriceStore((s) => s.errors);

  return useMemo(() => ({
    prices,
    fetchedAt: fetchedAt || '',
    status,
    errors,
  }), [prices, fetchedAt, status, errors]);
}
