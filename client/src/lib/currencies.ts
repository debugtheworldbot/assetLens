import { Currency, CurrencyInfo } from './types';

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'CNY', symbol: '¥', name: '人民币', nameEn: 'Chinese Yuan' },
  { code: 'USD', symbol: '$', name: '美元', nameEn: 'US Dollar' },
  { code: 'HKD', symbol: 'HK$', name: '港币', nameEn: 'Hong Kong Dollar' },
  { code: 'EUR', symbol: '€', name: '欧元', nameEn: 'Euro' },
  { code: 'JPY', symbol: '¥', name: '日元', nameEn: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: '英镑', nameEn: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: '新加坡元', nameEn: 'Singapore Dollar' },
  { code: 'KRW', symbol: '₩', name: '韩元', nameEn: 'Korean Won' },
  { code: 'USDT', symbol: '₮', name: 'USDT', nameEn: 'Tether' },
];

export const CURRENCY_MAP: Record<Currency, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c])
) as Record<Currency, CurrencyInfo>;

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_MAP[currency]?.symbol ?? '';
}

export function getCurrencyName(currency: Currency): string {
  return CURRENCY_MAP[currency]?.name ?? currency;
}
