"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SourceState = {
  id: string;
  name: string;
  status: "live" | "limited" | "offline";
  detail: string;
};

type Evidence = {
  title: string;
  url: string;
  source: string;
  kind: "news" | "official" | "reddit" | "x";
  publishedAt: string;
};

type Signal = {
  rank: number;
  symbol: string;
  company: string;
  sector: string;
  score: number;
  direction: "positive" | "negative" | "mixed";
  confidence: "高" | "中" | "低";
  price: number | null;
  changePercent: number | null;
  summary: string;
  evidence: Evidence[];
  sourceCount: number;
};

type MacroEvent = Evidence & { tag: string };

type ScanResponse = {
  mode: "live" | "demo";
  generatedAt: string;
  eventCount: number;
  sources: SourceState[];
  signals: Signal[];
  macroEvents: MacroEvent[];
  note?: string;
};

const WATCHLIST_KEY = "signal_watchlist";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間未知";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function directionLabel(direction: Signal["direction"]) {
  if (direction === "positive") return "正向訊號";
  if (direction === "negative") return "風險訊號";
  return "多空交錯";
}

export default function Home() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Signal["direction"]>("all");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const loadScan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/scan", { cache: "no-store" });
      if (!response.ok) throw new Error("scan failed");
      setData((await response.json()) as ScanResponse);
    } catch {
      setError("目前無法更新訊號，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScan();
    try {
      setWatchlist(JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]"));
    } catch {
      setWatchlist([]);
    }
  }, [loadScan]);

  const visibleSignals = useMemo(() => {
    if (!data) return [];
    return filter === "all"
      ? data.signals
      : data.signals.filter((item) => item.direction === filter);
  }, [data, filter]);

  function toggleWatch(symbol: string) {
    setWatchlist((current) => {
      const next = current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }

  const activeSourceCount =
    data?.sources.filter((source) => source.status === "live").length || 0;

  return (
    <div className="dashboard">
      <section className="hero">
        <div>
          <div className="eyebrow">US MARKET · EVENT INTELLIGENCE</div>
          <h1>從雜訊中，找出今天值得研究的股票</h1>
          <p>
            彙整財經新聞、白宮與聯準會消息及社群熱度，將事件轉換成可追溯的美股關注排行。
          </p>
        </div>
        <button className="refresh-button" onClick={loadScan} disabled={loading}>
          <span className={loading ? "spin" : ""}>↻</span>
          {loading ? "分析中" : "更新訊號"}
        </button>
      </section>

      {data?.mode === "demo" && (
        <div className="demo-banner">
          <strong>目前為示範模式</strong>
          <span>{data.note || "尚未取得足夠即時資料，排行使用範例訊號呈現。"}</span>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <section className="metric-grid">
        <div className="metric-card">
          <span>本次分析事件</span>
          <strong>{data?.eventCount ?? "—"}</strong>
          <small>新聞、官方與社群訊息</small>
        </div>
        <div className="metric-card">
          <span>已連線來源</span>
          <strong>{data ? `${activeSourceCount}/${data.sources.length}` : "—"}</strong>
          <small>來源狀態公開透明</small>
        </div>
        <div className="metric-card accent-metric">
          <span>值得關注</span>
          <strong>{data?.signals.length ?? "—"}</strong>
          <small>不等於買進建議</small>
        </div>
        <div className="metric-card">
          <span>最後更新</span>
          <strong className="metric-time">
            {data ? formatTime(data.generatedAt) : "—"}
          </strong>
          <small>台灣時間</small>
        </div>
      </section>

      <section className="source-strip" aria-label="資料來源狀態">
        {data?.sources.map((source) => (
          <div className="source-item" key={source.id} title={source.detail}>
            <span className={`status-dot ${source.status}`} />
            <div>
              <b>{source.name}</b>
              <small>{source.detail}</small>
            </div>
          </div>
        )) ||
          Array.from({ length: 4 }).map((_, index) => (
            <div className="source-item skeleton" key={index} />
          ))}
      </section>

      <div className="content-grid">
        <section className="panel ranking-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">SIGNAL RANKING</span>
              <h2>美股關注排行</h2>
            </div>
            <div className="filter-tabs">
              {([
                ["all", "全部"],
                ["positive", "正向"],
                ["negative", "風險"],
                ["mixed", "交錯"],
              ] as const).map(([value, label]) => (
                <button
                  className={filter === value ? "active" : ""}
                  key={value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="signal-list">
            {loading && !data
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div className="signal-card skeleton-card" key={index} />
                ))
              : visibleSignals.map((signal) => (
                  <article className="signal-card" key={signal.symbol}>
                    <div className="rank-number">{String(signal.rank).padStart(2, "0")}</div>
                    <div className="ticker-block">
                      <div className="ticker-row">
                        <strong>{signal.symbol}</strong>
                        <span className={`direction-pill ${signal.direction}`}>
                          {directionLabel(signal.direction)}
                        </span>
                      </div>
                      <span>{signal.company}</span>
                      <small>{signal.sector}</small>
                    </div>
                    <div className="signal-reason">
                      <p>{signal.summary}</p>
                      <div className="evidence-row">
                        {signal.evidence.slice(0, 2).map((item) => (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            key={`${signal.symbol}-${item.url}`}
                          >
                            <span>{item.source}</span>
                            {item.title}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="market-block">
                      <span>現價</span>
                      <strong>{signal.price == null ? "—" : `$${signal.price.toFixed(2)}`}</strong>
                      <small
                        className={
                          signal.changePercent == null
                            ? ""
                            : signal.changePercent >= 0
                              ? "up"
                              : "down"
                        }
                      >
                        {signal.changePercent == null
                          ? "行情未連線"
                          : `${signal.changePercent >= 0 ? "+" : ""}${signal.changePercent.toFixed(2)}%`}
                      </small>
                    </div>
                    <div className="score-block">
                      <div className="score-ring" style={{ "--score": signal.score } as React.CSSProperties}>
                        <strong>{signal.score}</strong>
                        <span>關注分</span>
                      </div>
                      <small>信心 {signal.confidence} · {signal.sourceCount}來源</small>
                      <button
                        className={watchlist.includes(signal.symbol) ? "watching" : ""}
                        onClick={() => toggleWatch(signal.symbol)}
                      >
                        {watchlist.includes(signal.symbol) ? "★ 已關注" : "☆ 加入關注"}
                      </button>
                    </div>
                  </article>
                ))}
          </div>

          {!loading && visibleSignals.length === 0 && (
            <div className="empty-state">這個條件下暫時沒有訊號。</div>
          )}
        </section>

        <aside className="side-column">
          <section className="panel macro-panel">
            <div className="panel-header compact">
              <div>
                <span className="section-kicker">MACRO WATCH</span>
                <h2>政策與總經訊號</h2>
              </div>
            </div>
            <div className="macro-list">
              {data?.macroEvents.map((event) => (
                <a href={event.url} target="_blank" rel="noreferrer" key={event.url}>
                  <div className="macro-meta">
                    <span>{event.tag}</span>
                    <time>{formatTime(event.publishedAt)}</time>
                  </div>
                  <h3>{event.title}</h3>
                  <small>{event.source} ↗</small>
                </a>
              )) || <div className="macro-placeholder">正在整理官方事件…</div>}
            </div>
          </section>

          <section className="panel methodology-mini">
            <span className="section-kicker">HOW IT WORKS</span>
            <h2>分數不是漲跌預測</h2>
            <p>
              關注分綜合事件權重、來源可信度、討論強度與時效性，衡量「值得研究的程度」，不是預測報酬率。
            </p>
            <div className="factor-bars">
              <div><span>事件與來源</span><b style={{ width: "88%" }} /></div>
              <div><span>社群熱度</span><b style={{ width: "64%" }} /></div>
              <div><span>時效與交叉驗證</span><b style={{ width: "76%" }} /></div>
            </div>
          </section>
        </aside>
      </div>

      <footer className="disclaimer">
        本站資訊僅供研究與產品展示，不構成投資建議、邀約或報酬保證。投資人應自行查證來源並評估風險。
      </footer>
    </div>
  );
}
