import { callDataApi } from './server/_core/dataApi.ts';

async function test() {
  const symbols = ['BRK-B', 'BRK.B', 'BRK-B.US'];
  for (const s of symbols) {
    try {
      const r = await callDataApi('YahooFinance/get_stock_chart', { query: { symbol: s, interval: '1d', range: '1d' } });
      const meta = r?.chart?.result?.[0]?.meta;
      console.log(s, '->', meta?.regularMarketPrice, meta?.shortName);
    } catch(e) { console.log(s, '-> ERROR', e.message); }
  }
}
test();
