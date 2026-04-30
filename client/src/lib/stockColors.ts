/**
 * A palette of visually distinct colors for individual stocks.
 * Uses warm, muted tones that complement the AssetLens design.
 */
const STOCK_PALETTE = [
  '#E76F51', // terracotta
  '#F4A261', // sandy orange
  '#E9C46A', // golden
  '#2A9D8F', // teal
  '#264653', // dark blue
  '#8338EC', // purple
  '#FF006E', // magenta
  '#3A86FF', // blue
  '#06D6A0', // mint
  '#EF476F', // pink
  '#118AB2', // ocean blue
  '#073B4C', // navy
  '#FFD166', // yellow
  '#8D99AE', // slate
  '#D62828', // red
  '#457B9D', // steel blue
  '#A8DADC', // light teal
  '#6D6875', // mauve gray
  '#B5838D', // dusty rose
  '#E07A5F', // burnt sienna
];

/**
 * Get a color for a stock based on its index in the list.
 * If the stock already has a color assigned, use that.
 */
export function getStockColor(index: number): string {
  return STOCK_PALETTE[index % STOCK_PALETTE.length];
}

/**
 * Assign colors to all stock assets that don't have one yet.
 * Returns a map of asset id -> color.
 */
export function assignStockColors(assets: { id: string; category: string; color?: string }[]): Record<string, string> {
  const colorMap: Record<string, string> = {};
  let colorIndex = 0;

  for (const asset of assets) {
    if (asset.category === 'stock') {
      if (asset.color) {
        colorMap[asset.id] = asset.color;
      } else {
        colorMap[asset.id] = getStockColor(colorIndex);
      }
      colorIndex++;
    }
  }

  return colorMap;
}

export { STOCK_PALETTE };
