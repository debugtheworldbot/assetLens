/**
 * Common stock lists for A-share, HK, and US markets.
 * Used for fuzzy search / autocomplete.
 */

export interface StockInfo {
  ticker: string;   // e.g. "600519"
  name: string;     // Chinese name
  nameEn?: string;  // English name (optional)
}

// ===== A股 (Shanghai & Shenzhen) =====
export const CN_STOCKS: StockInfo[] = [
  // 上证50 / 沪深300 核心成分股
  { ticker: "600519", name: "贵州茅台", nameEn: "Kweichow Moutai" },
  { ticker: "601318", name: "中国平安", nameEn: "Ping An Insurance" },
  { ticker: "600036", name: "招商银行", nameEn: "China Merchants Bank" },
  { ticker: "601166", name: "兴业银行", nameEn: "Industrial Bank" },
  { ticker: "600276", name: "恒瑞医药", nameEn: "Hengrui Medicine" },
  { ticker: "601398", name: "工商银行", nameEn: "ICBC" },
  { ticker: "601288", name: "农业银行", nameEn: "Agricultural Bank" },
  { ticker: "601939", name: "建设银行", nameEn: "China Construction Bank" },
  { ticker: "601988", name: "中国银行", nameEn: "Bank of China" },
  { ticker: "600000", name: "浦发银行", nameEn: "SPD Bank" },
  { ticker: "600016", name: "民生银行", nameEn: "Minsheng Bank" },
  { ticker: "600030", name: "中信证券", nameEn: "CITIC Securities" },
  { ticker: "601688", name: "华泰证券", nameEn: "Huatai Securities" },
  { ticker: "600837", name: "海通证券", nameEn: "Haitong Securities" },
  { ticker: "601857", name: "中国石油", nameEn: "PetroChina" },
  { ticker: "600028", name: "中国石化", nameEn: "Sinopec" },
  { ticker: "601088", name: "中国神华", nameEn: "China Shenhua Energy" },
  { ticker: "600900", name: "长江电力", nameEn: "Yangtze Power" },
  { ticker: "601012", name: "隆基绿能", nameEn: "LONGi Green Energy" },
  { ticker: "600809", name: "山西汾酒", nameEn: "Shanxi Fenjiu" },
  { ticker: "000858", name: "五粮液", nameEn: "Wuliangye Yibin" },
  { ticker: "000333", name: "美的集团", nameEn: "Midea Group" },
  { ticker: "000651", name: "格力电器", nameEn: "Gree Electric" },
  { ticker: "002594", name: "比亚迪", nameEn: "BYD" },
  { ticker: "300750", name: "宁德时代", nameEn: "CATL" },
  { ticker: "002415", name: "海康威视", nameEn: "Hikvision" },
  { ticker: "000001", name: "平安银行", nameEn: "Ping An Bank" },
  { ticker: "000002", name: "万科A", nameEn: "China Vanke" },
  { ticker: "600048", name: "保利发展", nameEn: "Poly Developments" },
  { ticker: "601668", name: "中国建筑", nameEn: "China State Construction" },
  { ticker: "600585", name: "海螺水泥", nameEn: "Anhui Conch Cement" },
  { ticker: "601899", name: "紫金矿业", nameEn: "Zijin Mining" },
  { ticker: "002475", name: "立讯精密", nameEn: "Luxshare Precision" },
  { ticker: "300059", name: "东方财富", nameEn: "East Money" },
  { ticker: "600887", name: "伊利股份", nameEn: "Yili Group" },
  { ticker: "000568", name: "泸州老窖", nameEn: "Luzhou Laojiao" },
  { ticker: "600690", name: "海尔智家", nameEn: "Haier Smart Home" },
  { ticker: "601888", name: "中国中免", nameEn: "China Tourism Group Duty Free" },
  { ticker: "603259", name: "药明康德", nameEn: "WuXi AppTec" },
  { ticker: "688981", name: "中芯国际", nameEn: "SMIC" },
  { ticker: "688111", name: "金山办公", nameEn: "Kingsoft Office" },
  { ticker: "600031", name: "三一重工", nameEn: "Sany Heavy Industry" },
  { ticker: "601633", name: "长城汽车", nameEn: "Great Wall Motor" },
  { ticker: "600104", name: "上汽集团", nameEn: "SAIC Motor" },
  { ticker: "002230", name: "科大讯飞", nameEn: "iFlytek" },
  { ticker: "300760", name: "迈瑞医疗", nameEn: "Mindray Medical" },
  { ticker: "002304", name: "洋河股份", nameEn: "Yanghe Brewery" },
  { ticker: "600050", name: "中国联通", nameEn: "China Unicom" },
  { ticker: "601728", name: "中国电信", nameEn: "China Telecom" },
  { ticker: "600941", name: "中国移动", nameEn: "China Mobile" },
  { ticker: "688012", name: "中微公司", nameEn: "AMEC" },
  { ticker: "688036", name: "传音控股", nameEn: "Transsion Holdings" },
  { ticker: "002714", name: "牧原股份", nameEn: "Muyuan Foods" },
  { ticker: "601225", name: "陕西煤业", nameEn: "Shaanxi Coal Industry" },
  { ticker: "600309", name: "万华化学", nameEn: "Wanhua Chemical" },
  { ticker: "002352", name: "顺丰控股", nameEn: "SF Holding" },
  { ticker: "601919", name: "中远海控", nameEn: "COSCO Shipping Holdings" },
  { ticker: "600438", name: "通威股份", nameEn: "Tongwei" },
  { ticker: "002049", name: "紫光国微", nameEn: "Unigroup Guoxin" },
  { ticker: "688599", name: "天合光能", nameEn: "Trina Solar" },
  // 常见 ETF
  { ticker: "510300", name: "沪深300ETF", nameEn: "CSI 300 ETF" },
  { ticker: "510050", name: "上证50ETF", nameEn: "SSE 50 ETF" },
  { ticker: "510500", name: "中证500ETF", nameEn: "CSI 500 ETF" },
  { ticker: "159919", name: "沪深300ETF", nameEn: "CSI 300 ETF (SZ)" },
  { ticker: "159915", name: "创业板ETF", nameEn: "ChiNext ETF" },
  { ticker: "518880", name: "黄金ETF", nameEn: "Gold ETF" },
  { ticker: "513100", name: "纳指ETF", nameEn: "NASDAQ ETF" },
  { ticker: "513050", name: "中概互联ETF", nameEn: "China Internet ETF" },
  { ticker: "512690", name: "酒ETF", nameEn: "Liquor ETF" },
  { ticker: "512660", name: "军工ETF", nameEn: "Military ETF" },
  { ticker: "512010", name: "医药ETF", nameEn: "Pharma ETF" },
  { ticker: "515790", name: "光伏ETF", nameEn: "Solar ETF" },
  { ticker: "512480", name: "半导体ETF", nameEn: "Semiconductor ETF" },
  { ticker: "159869", name: "游戏ETF", nameEn: "Gaming ETF" },
  { ticker: "512800", name: "银行ETF", nameEn: "Bank ETF" },
  { ticker: "512000", name: "券商ETF", nameEn: "Brokerage ETF" },
  { ticker: "515880", name: "通信ETF", nameEn: "Telecom ETF" },
  { ticker: "159941", name: "纳指ETF", nameEn: "NASDAQ ETF (SZ)" },
  { ticker: "513500", name: "标普500ETF", nameEn: "S&P 500 ETF" },
  { ticker: "159605", name: "中概互联ETF", nameEn: "China Internet ETF (SZ)" },
];

// ===== 港股 (Hong Kong) =====
export const HK_STOCKS: StockInfo[] = [
  { ticker: "00700", name: "腾讯控股", nameEn: "Tencent" },
  { ticker: "09988", name: "阿里巴巴", nameEn: "Alibaba" },
  { ticker: "03690", name: "美团", nameEn: "Meituan" },
  { ticker: "09999", name: "网易", nameEn: "NetEase" },
  { ticker: "09618", name: "京东集团", nameEn: "JD.com" },
  { ticker: "01810", name: "小米集团", nameEn: "Xiaomi" },
  { ticker: "09888", name: "百度集团", nameEn: "Baidu" },
  { ticker: "02020", name: "安踏体育", nameEn: "Anta Sports" },
  { ticker: "00941", name: "中国移动", nameEn: "China Mobile" },
  { ticker: "00005", name: "汇丰控股", nameEn: "HSBC Holdings" },
  { ticker: "00388", name: "香港交易所", nameEn: "HKEX" },
  { ticker: "02318", name: "中国平安", nameEn: "Ping An Insurance" },
  { ticker: "01299", name: "友邦保险", nameEn: "AIA Group" },
  { ticker: "00883", name: "中国海洋石油", nameEn: "CNOOC" },
  { ticker: "02628", name: "中国人寿", nameEn: "China Life Insurance" },
  { ticker: "01398", name: "工商银行", nameEn: "ICBC" },
  { ticker: "03988", name: "中国银行", nameEn: "Bank of China" },
  { ticker: "00939", name: "建设银行", nameEn: "CCB" },
  { ticker: "01288", name: "农业银行", nameEn: "ABC" },
  { ticker: "03968", name: "招商银行", nameEn: "China Merchants Bank" },
  { ticker: "00027", name: "银河娱乐", nameEn: "Galaxy Entertainment" },
  { ticker: "01928", name: "金沙中国", nameEn: "Sands China" },
  { ticker: "00016", name: "新鸿基地产", nameEn: "Sun Hung Kai Properties" },
  { ticker: "00001", name: "长和", nameEn: "CK Hutchison" },
  { ticker: "00002", name: "中电控股", nameEn: "CLP Holdings" },
  { ticker: "00003", name: "香港中华煤气", nameEn: "Hong Kong & China Gas" },
  { ticker: "00006", name: "电能实业", nameEn: "Power Assets" },
  { ticker: "00011", name: "恒生银行", nameEn: "Hang Seng Bank" },
  { ticker: "00066", name: "港铁公司", nameEn: "MTR Corporation" },
  { ticker: "00175", name: "吉利汽车", nameEn: "Geely Automobile" },
  { ticker: "02015", name: "理想汽车", nameEn: "Li Auto" },
  { ticker: "09866", name: "蔚来", nameEn: "NIO" },
  { ticker: "09868", name: "小鹏汽车", nameEn: "XPeng" },
  { ticker: "06060", name: "众安在线", nameEn: "ZhongAn Online" },
  { ticker: "06618", name: "京东健康", nameEn: "JD Health" },
  { ticker: "02382", name: "舜宇光学", nameEn: "Sunny Optical" },
  { ticker: "00669", name: "创科实业", nameEn: "Techtronic Industries" },
  { ticker: "01024", name: "快手", nameEn: "Kuaishou" },
  { ticker: "09626", name: "哔哩哔哩", nameEn: "Bilibili" },
  { ticker: "01211", name: "比亚迪股份", nameEn: "BYD Company" },
  // 港股 ETF
  { ticker: "02800", name: "盈富基金", nameEn: "Tracker Fund of HK" },
  { ticker: "02840", name: "SPDR金ETF", nameEn: "SPDR Gold Trust" },
  { ticker: "03033", name: "南方恒生科技ETF", nameEn: "CSOP Hang Seng TECH ETF" },
  { ticker: "03067", name: "安硕A50ETF", nameEn: "iShares FTSE A50 China ETF" },
];

// ===== 美股 (US) =====
export const US_STOCKS: StockInfo[] = [
  // FAANG + Magnificent 7
  { ticker: "AAPL", name: "苹果公司", nameEn: "Apple" },
  { ticker: "MSFT", name: "微软", nameEn: "Microsoft" },
  { ticker: "GOOGL", name: "谷歌A", nameEn: "Alphabet (Google) Class A" },
  { ticker: "GOOG", name: "谷歌C", nameEn: "Alphabet (Google) Class C" },
  { ticker: "AMZN", name: "亚马逊", nameEn: "Amazon" },
  { ticker: "META", name: "Meta", nameEn: "Meta Platforms" },
  { ticker: "NVDA", name: "英伟达", nameEn: "NVIDIA" },
  { ticker: "TSLA", name: "特斯拉", nameEn: "Tesla" },
  // 科技
  { ticker: "TSM", name: "台积电", nameEn: "TSMC" },
  { ticker: "AVGO", name: "博通", nameEn: "Broadcom" },
  { ticker: "AMD", name: "AMD", nameEn: "Advanced Micro Devices" },
  { ticker: "INTC", name: "英特尔", nameEn: "Intel" },
  { ticker: "QCOM", name: "高通", nameEn: "Qualcomm" },
  { ticker: "CRM", name: "Salesforce", nameEn: "Salesforce" },
  { ticker: "ORCL", name: "甲骨文", nameEn: "Oracle" },
  { ticker: "ADBE", name: "Adobe", nameEn: "Adobe" },
  { ticker: "NFLX", name: "奈飞", nameEn: "Netflix" },
  { ticker: "CSCO", name: "思科", nameEn: "Cisco" },
  { ticker: "UBER", name: "优步", nameEn: "Uber" },
  { ticker: "SHOP", name: "Shopify", nameEn: "Shopify" },
  { ticker: "SNOW", name: "Snowflake", nameEn: "Snowflake" },
  { ticker: "PLTR", name: "Palantir", nameEn: "Palantir Technologies" },
  // 中概股
  { ticker: "BABA", name: "阿里巴巴", nameEn: "Alibaba (ADR)" },
  { ticker: "JD", name: "京东", nameEn: "JD.com (ADR)" },
  { ticker: "PDD", name: "拼多多", nameEn: "PDD Holdings" },
  { ticker: "BIDU", name: "百度", nameEn: "Baidu (ADR)" },
  { ticker: "NIO", name: "蔚来", nameEn: "NIO" },
  { ticker: "XPEV", name: "小鹏汽车", nameEn: "XPeng (ADR)" },
  { ticker: "LI", name: "理想汽车", nameEn: "Li Auto (ADR)" },
  { ticker: "BILI", name: "哔哩哔哩", nameEn: "Bilibili (ADR)" },
  { ticker: "TME", name: "腾讯音乐", nameEn: "Tencent Music" },
  { ticker: "FUTU", name: "富途控股", nameEn: "Futu Holdings" },
  { ticker: "MNSO", name: "名创优品", nameEn: "MINISO" },
  // 金融
  { ticker: "BRK.B", name: "伯克希尔B", nameEn: "Berkshire Hathaway B" },
  { ticker: "JPM", name: "摩根大通", nameEn: "JPMorgan Chase" },
  { ticker: "V", name: "Visa", nameEn: "Visa" },
  { ticker: "MA", name: "万事达", nameEn: "Mastercard" },
  { ticker: "BAC", name: "美国银行", nameEn: "Bank of America" },
  { ticker: "GS", name: "高盛", nameEn: "Goldman Sachs" },
  // 消费
  { ticker: "WMT", name: "沃尔玛", nameEn: "Walmart" },
  { ticker: "COST", name: "开市客", nameEn: "Costco" },
  { ticker: "KO", name: "可口可乐", nameEn: "Coca-Cola" },
  { ticker: "PEP", name: "百事可乐", nameEn: "PepsiCo" },
  { ticker: "MCD", name: "麦当劳", nameEn: "McDonald's" },
  { ticker: "SBUX", name: "星巴克", nameEn: "Starbucks" },
  { ticker: "NKE", name: "耐克", nameEn: "Nike" },
  { ticker: "DIS", name: "迪士尼", nameEn: "Walt Disney" },
  // 医药
  { ticker: "JNJ", name: "强生", nameEn: "Johnson & Johnson" },
  { ticker: "UNH", name: "联合健康", nameEn: "UnitedHealth" },
  { ticker: "LLY", name: "礼来", nameEn: "Eli Lilly" },
  { ticker: "PFE", name: "辉瑞", nameEn: "Pfizer" },
  { ticker: "ABBV", name: "艾伯维", nameEn: "AbbVie" },
  { ticker: "MRK", name: "默沙东", nameEn: "Merck" },
  // 能源 / 工业
  { ticker: "XOM", name: "埃克森美孚", nameEn: "Exxon Mobil" },
  { ticker: "CVX", name: "雪佛龙", nameEn: "Chevron" },
  { ticker: "BA", name: "波音", nameEn: "Boeing" },
  { ticker: "CAT", name: "卡特彼勒", nameEn: "Caterpillar" },
  // ETF
  { ticker: "SPY", name: "标普500ETF", nameEn: "SPDR S&P 500 ETF" },
  { ticker: "QQQ", name: "纳斯达克100ETF", nameEn: "Invesco QQQ Trust" },
  { ticker: "IWM", name: "罗素2000ETF", nameEn: "iShares Russell 2000 ETF" },
  { ticker: "VTI", name: "全美股票ETF", nameEn: "Vanguard Total Stock Market ETF" },
  { ticker: "VOO", name: "先锋标普500ETF", nameEn: "Vanguard S&P 500 ETF" },
  { ticker: "GLD", name: "黄金ETF", nameEn: "SPDR Gold Shares" },
  { ticker: "TLT", name: "20年国债ETF", nameEn: "iShares 20+ Year Treasury Bond ETF" },
  { ticker: "ARKK", name: "ARK创新ETF", nameEn: "ARK Innovation ETF" },
  { ticker: "KWEB", name: "中概互联ETF", nameEn: "KraneShares CSI China Internet ETF" },
  { ticker: "EEM", name: "新兴市场ETF", nameEn: "iShares MSCI Emerging Markets ETF" },
  { ticker: "SOXX", name: "半导体ETF", nameEn: "iShares Semiconductor ETF" },
];

export type MarketType = "CN" | "HK" | "US";

const MARKET_MAP: Record<MarketType, StockInfo[]> = {
  CN: CN_STOCKS,
  HK: HK_STOCKS,
  US: US_STOCKS,
};

/**
 * Fuzzy search stocks by ticker code or name (Chinese / English).
 * Returns up to `limit` results.
 */
export function fuzzySearchStocks(
  query: string,
  market: MarketType,
  limit = 8,
): StockInfo[] {
  if (!query || query.trim().length === 0) return [];

  const q = query.trim().toLowerCase();
  const list = MARKET_MAP[market] ?? [];

  // Score each stock
  const scored = list.map((s) => {
    let score = 0;
    const tickerLower = s.ticker.toLowerCase();
    const nameLower = s.name.toLowerCase();
    const nameEnLower = (s.nameEn ?? "").toLowerCase();

    // Exact ticker match → highest priority
    if (tickerLower === q) {
      score = 100;
    }
    // Ticker starts with query
    else if (tickerLower.startsWith(q)) {
      score = 80;
    }
    // Ticker contains query
    else if (tickerLower.includes(q)) {
      score = 60;
    }
    // Chinese name contains query
    else if (nameLower.includes(q)) {
      score = 50;
    }
    // English name starts with query
    else if (nameEnLower.startsWith(q)) {
      score = 45;
    }
    // English name contains query
    else if (nameEnLower.includes(q)) {
      score = 40;
    }

    return { stock: s, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.stock);
}
