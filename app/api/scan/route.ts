import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "news" | "official" | "reddit" | "x";
type Status = "live" | "limited" | "offline";

type RawItem = {
  title: string;
  url: string;
  source: string;
  kind: Kind;
  publishedAt: string;
  body?: string;
  engagement?: number;
};

type Company = {
  symbol: string;
  company: string;
  sector: string;
  aliases: string[];
};

const COMPANIES: Company[] = [
  { symbol: "AAPL", company: "Apple", sector: "消費電子", aliases: ["apple", "iphone", "aapl"] },
  { symbol: "MSFT", company: "Microsoft", sector: "雲端與軟體", aliases: ["microsoft", "azure", "msft"] },
  { symbol: "NVDA", company: "NVIDIA", sector: "半導體與AI", aliases: ["nvidia", "nvda", "blackwell"] },
  { symbol: "AMZN", company: "Amazon", sector: "電商與雲端", aliases: ["amazon", "aws", "amzn"] },
  { symbol: "GOOGL", company: "Alphabet", sector: "網路與AI", aliases: ["alphabet", "google", "gemini", "googl"] },
  { symbol: "META", company: "Meta Platforms", sector: "社群與廣告", aliases: ["meta platforms", "facebook", "instagram", "meta"] },
  { symbol: "TSLA", company: "Tesla", sector: "電動車與能源", aliases: ["tesla", "tsla", "cybertruck"] },
  { symbol: "AMD", company: "Advanced Micro Devices", sector: "半導體", aliases: ["advanced micro devices", "amd", "ryzen"] },
  { symbol: "AVGO", company: "Broadcom", sector: "半導體與網通", aliases: ["broadcom", "avgo"] },
  { symbol: "INTC", company: "Intel", sector: "半導體", aliases: ["intel", "intc"] },
  { symbol: "JPM", company: "JPMorgan Chase", sector: "金融", aliases: ["jpmorgan", "jp morgan", "jpm"] },
  { symbol: "BAC", company: "Bank of America", sector: "金融", aliases: ["bank of america", "bofa", "bac"] },
  { symbol: "XOM", company: "Exxon Mobil", sector: "能源", aliases: ["exxon", "exxonmobil", "xom"] },
  { symbol: "CVX", company: "Chevron", sector: "能源", aliases: ["chevron", "cvx"] },
  { symbol: "LLY", company: "Eli Lilly", sector: "製藥", aliases: ["eli lilly", "lilly", "mounjaro", "zepbound", "lly"] },
  { symbol: "UNH", company: "UnitedHealth", sector: "醫療保健", aliases: ["unitedhealth", "optum", "unh"] },
  { symbol: "WMT", company: "Walmart", sector: "零售", aliases: ["walmart", "wmt"] },
  { symbol: "CAT", company: "Caterpillar", sector: "工業設備", aliases: ["caterpillar", "cat inc"] },
  { symbol: "BA", company: "Boeing", sector: "航太國防", aliases: ["boeing", "737 max"] },
  { symbol: "PLTR", company: "Palantir", sector: "資料分析與國防科技", aliases: ["palantir", "pltr"] },
];

const POSITIVE = ["beat", "surge", "record", "growth", "approval", "contract", "partnership", "upgrade", "profit", "strong", "wins", "expands", "rally"];
const NEGATIVE = ["miss", "falls", "drop", "lawsuit", "probe", "recall", "cut", "warning", "risk", "ban", "tariff", "layoff", "decline"];

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decode(match[1]) : "";
}

function parseRss(xml: string, source: string, limit = 12): RawItem[] {
  return Array.from(xml.matchAll(/<item[\s\S]*?<\/item>/gi))
    .slice(0, limit)
    .map((match) => {
      const block = match[0];
      return {
        title: tag(block, "title"),
        url: tag(block, "link"),
        source,
        kind: "official" as const,
        publishedAt: new Date(tag(block, "pubDate") || Date.now()).toISOString(),
        body: tag(block, "description"),
      };
    })
    .filter((item) => item.title && item.url);
}

async function getFinnhub(): Promise<RawItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const raw = await fetchText(`https://finnhub.io/api/v1/news?category=general&token=${key}`);
  const rows = JSON.parse(raw) as Array<{
    headline?: string;
    url?: string;
    source?: string;
    datetime?: number;
    summary?: string;
  }>;
  return rows.slice(0, 60).flatMap((row) =>
    row.headline && row.url
      ? [{
          title: row.headline,
          url: row.url,
          source: row.source || "Finnhub News",
          kind: "news" as const,
          publishedAt: new Date((row.datetime || Date.now() / 1000) * 1000).toISOString(),
          body: row.summary || "",
        }]
      : []
  );
}

async function getFed(): Promise<RawItem[]> {
  const xml = await fetchText("https://www.federalreserve.gov/feeds/press_all.xml");
  return parseRss(xml, "Federal Reserve");
}

async function getWhiteHouse(): Promise<RawItem[]> {
  const html = await fetchText("https://www.whitehouse.gov/news/");
  const links = Array.from(
    html.matchAll(/<a[^>]+href=["']((?:https:\/\/www\.whitehouse\.gov)?\/(?:briefings-statements|fact-sheets|presidential-actions|news)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)
  );
  const seen = new Set<string>();
  return links.flatMap((match) => {
    const url = match[1].startsWith("http")
      ? match[1]
      : `https://www.whitehouse.gov${match[1]}`;
    const title = decode(match[2]);
    if (!title || title.length < 18 || seen.has(url)) return [];
    seen.add(url);
    return [{
      title,
      url,
      source: "The White House",
      kind: "official" as const,
      publishedAt: new Date().toISOString(),
    }];
  }).slice(0, 12);
}

async function getReddit(): Promise<RawItem[]> {
  const raw = await fetchText(
    "https://www.reddit.com/r/stocks+investing+wallstreetbets/hot.json?limit=40&raw_json=1",
    { headers: { "User-Agent": "SignalDesk-MVP/1.0" } }
  );
  const payload = JSON.parse(raw) as {
    data?: { children?: Array<{ data?: { title?: string; permalink?: string; created_utc?: number; ups?: number; selftext?: string } }> };
  };
  return (payload.data?.children || []).flatMap((child) => {
    const row = child.data;
    return row?.title && row.permalink
      ? [{
          title: row.title,
          url: `https://www.reddit.com${row.permalink}`,
          source: "Reddit",
          kind: "reddit" as const,
          publishedAt: new Date((row.created_utc || Date.now() / 1000) * 1000).toISOString(),
          body: row.selftext || "",
          engagement: row.ups || 0,
        }]
      : [];
  });
}

async function getX(): Promise<RawItem[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];
  const headers = { Authorization: `Bearer ${token}` };
  const handles = ["WhiteHouse", "federalreserve"];
  const output: RawItem[] = [];

  for (const handle of handles) {
    const userRaw = await fetchText(`https://api.x.com/2/users/by/username/${handle}`, { headers });
    const user = JSON.parse(userRaw) as { data?: { id?: string } };
    if (!user.data?.id) continue;
    const postsRaw = await fetchText(
      `https://api.x.com/2/users/${user.data.id}/tweets?max_results=5&exclude=retweets,replies&tweet.fields=created_at,public_metrics`,
      { headers }
    );
    const posts = JSON.parse(postsRaw) as {
      data?: Array<{ id: string; text: string; created_at?: string; public_metrics?: { like_count?: number; retweet_count?: number } }>;
    };
    for (const post of posts.data || []) {
      output.push({
        title: post.text.replace(/\s+/g, " ").slice(0, 220),
        url: `https://x.com/${handle}/status/${post.id}`,
        source: `X · @${handle}`,
        kind: "x",
        publishedAt: post.created_at || new Date().toISOString(),
        engagement: (post.public_metrics?.like_count || 0) + (post.public_metrics?.retweet_count || 0) * 2,
      });
    }
  }
  return output;
}

function sentiment(text: string) {
  const content = text.toLowerCase();
  const positive = POSITIVE.filter((word) => content.includes(word)).length;
  const negative = NEGATIVE.filter((word) => content.includes(word)).length;
  return positive === negative ? 0 : positive > negative ? 1 : -1;
}

function matches(text: string, alias: string) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

async function getQuotes(symbols: string[]) {
  const key = process.env.FINNHUB_API_KEY;
  const result: Record<string, { price: number | null; changePercent: number | null }> = {};
  if (!key) return result;
  await Promise.all(symbols.map(async (symbol) => {
    try {
      const raw = await fetchText(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`);
      const quote = JSON.parse(raw) as { c?: number; dp?: number };
      result[symbol] = {
        price: typeof quote.c === "number" && quote.c > 0 ? quote.c : null,
        changePercent: typeof quote.dp === "number" ? quote.dp : null,
      };
    } catch {
      result[symbol] = { price: null, changePercent: null };
    }
  }));
  return result;
}

function demoSignals() {
  const examples = [
    { symbol: "NVDA", company: "NVIDIA", sector: "半導體與AI", score: 86, direction: "positive" as const, summary: "範例：AI資本支出與晶片供應鏈消息形成多來源關注。" },
    { symbol: "MSFT", company: "Microsoft", sector: "雲端與軟體", score: 79, direction: "mixed" as const, summary: "範例：雲端需求具支撐，但估值與監管消息需要交叉確認。" },
    { symbol: "JPM", company: "JPMorgan Chase", sector: "金融", score: 72, direction: "mixed" as const, summary: "範例：利率路徑與信貸品質是近期主要觀察因素。" },
  ];
  return examples.map((item, index) => ({
    ...item,
    rank: index + 1,
    confidence: index === 0 ? "高" as const : "中" as const,
    price: null,
    changePercent: null,
    sourceCount: index === 0 ? 3 : 2,
    evidence: [{
      title: "示範資料：連線成功後將顯示可點擊的原始消息",
      url: "https://www.federalreserve.gov/feeds/feeds.htm",
      source: "MVP Demo",
      kind: "official" as const,
      publishedAt: new Date().toISOString(),
    }],
  }));
}

function macroTag(title: string) {
  const value = title.toLowerCase();
  if (value.includes("monetary") || value.includes("rate") || value.includes("fomc")) return "利率政策";
  if (value.includes("tariff") || value.includes("trade")) return "貿易政策";
  if (value.includes("ai") || value.includes("technology")) return "科技政策";
  return "官方訊息";
}

export async function GET() {
  const sourceResults = await Promise.allSettled([
    getFinnhub(),
    getFed(),
    getWhiteHouse(),
    getReddit(),
    getX(),
  ]);

  const names = ["Finnhub News", "Federal Reserve", "The White House", "Reddit", "X 官方帳號"];
  const ids = ["finnhub", "fed", "whitehouse", "reddit", "x"];
  const itemsBySource = sourceResults.map((result) => result.status === "fulfilled" ? result.value : []);
  const allItems = itemsBySource.flat();
  const sources = sourceResults.map((result, index) => {
    const count = itemsBySource[index].length;
    let status: Status = count > 0 ? "live" : "offline";
    let detail = count > 0 ? `${count} 則已納入` : "本次未取得資料";
    if (ids[index] === "x" && !process.env.X_BEARER_TOKEN) {
      status = "limited";
      detail = "尚未設定付費API";
    }
    if (ids[index] === "finnhub" && !process.env.FINNHUB_API_KEY) {
      status = "limited";
      detail = "尚未設定API金鑰";
    }
    return { id: ids[index], name: names[index], status, detail };
  });

  const scored = COMPANIES.flatMap((company) => {
    const evidence = allItems.filter((item) => {
      const content = `${item.title} ${item.body || ""}`;
      return company.aliases.some((alias) => matches(content, alias));
    });
    if (!evidence.length) return [];

    let weight = 0;
    let tone = 0;
    for (const item of evidence) {
      const ageHours = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000);
      const freshness = ageHours < 24 ? 1 : ageHours < 72 ? 0.75 : 0.5;
      const sourceWeight = item.kind === "official" ? 18 : item.kind === "x" ? 14 : item.kind === "news" ? 12 : 7;
      const engagementBoost = item.engagement ? Math.min(6, Math.log10(item.engagement + 1) * 2) : 0;
      weight += (sourceWeight + engagementBoost) * freshness;
      tone += sentiment(`${item.title} ${item.body || ""}`) * sourceWeight;
    }
    const uniqueSources = new Set(evidence.map((item) => item.source)).size;
    weight += Math.max(0, uniqueSources - 1) * 6;
    return [{
      ...company,
      score: Math.round(Math.min(96, 42 + weight)),
      direction: tone > 8 ? "positive" as const : tone < -8 ? "negative" as const : "mixed" as const,
      confidence: uniqueSources >= 3 ? "高" as const : uniqueSources === 2 ? "中" as const : "低" as const,
      sourceCount: uniqueSources,
      summary: uniqueSources > 1
        ? `${uniqueSources}個獨立來源同時提及，近期事件密度上升，適合進一步查證。`
        : "近期出現明確事件訊號，但仍需等待其他來源交叉驗證。",
      evidence: evidence.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).slice(0, 3),
    }];
  }).sort((a, b) => b.score - a.score).slice(0, 8);

  const quotes = await getQuotes(scored.map((item) => item.symbol));
  const liveSignals = scored.map((item, index) => ({
    ...item,
    rank: index + 1,
    price: quotes[item.symbol]?.price ?? null,
    changePercent: quotes[item.symbol]?.changePercent ?? null,
  }));
  const mode = liveSignals.length ? "live" as const : "demo" as const;
  const official = allItems.filter((item) => item.kind === "official").slice(0, 5);

  return NextResponse.json({
    mode,
    generatedAt: new Date().toISOString(),
    eventCount: allItems.length,
    sources,
    signals: mode === "live" ? liveSignals : demoSignals(),
    macroEvents: official.map((item) => ({ ...item, tag: macroTag(item.title) })),
    note: mode === "demo" ? "尚未取得可匹配個股的即時事件，因此使用明確標示的範例訊號。" : undefined,
  }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
