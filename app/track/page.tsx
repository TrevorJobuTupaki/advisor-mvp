"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

/* ================================
   型別定義
================================ */
type Trade = {
  id: string;
  date: string;
  price: number;
  shares: number;
};

type Position = {
  symbol: string;
  trades: Trade[];
};

type QuoteMap = Record<string, number | null>;

const POSITIONS_KEY = "positions";

/* ================================
   工具函式
================================ */
function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadPositions(): Position[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePositions(positions: Position[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
}

function computeStats(position: Position, price: number | null) {
  let earliestDate: string | null = null;
  let totalShares = 0;
  let totalCost = 0;

  for (const t of position.trades) {
    if (!Number.isFinite(t.price) || !Number.isFinite(t.shares)) continue;
    if (!earliestDate || (t.date && t.date < earliestDate)) earliestDate = t.date;

    totalShares += t.shares;
    totalCost += t.price * t.shares;
  }

  const avgPrice = totalShares > 0 ? totalCost / totalShares : null;

  let marketValue = null;
  let pnl = null;
  let pnlPct = null;

  if (price != null && totalShares > 0) {
    marketValue = price * totalShares;
    pnl = marketValue - totalCost;
    pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : null;
  }

  return { earliestDate, totalShares, totalCost, avgPrice, marketValue, pnl, pnlPct };
}

/* ================================
   主頁面組件
================================ */
export default function TrackPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // 新增持股欄位
  const [newSymbol, setNewSymbol] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newPrice, setNewPrice] = useState("");
  const [newShares, setNewShares] = useState("");

  // 展開明細
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // 新增明細
  const [detailDate, setDetailDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [detailPrice, setDetailPrice] = useState("");
  const [detailShares, setDetailShares] = useState("");

  /* ================================
     初始載入
  ================================= */
  useEffect(() => {
    setPositions(loadPositions());
  }, []);

  /* ================================
     抓報價
  ================================= */
  useEffect(() => {
    const symbols = positions.map((p) => p.symbol);
    if (!symbols.length) return;

    (async () => {
      try {
        setLoadingQuotes(true);
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols }),
        });

        const data = await res.json();
        setQuotes(data.quotes || {});
      } catch (e) {
        console.error("quote error:", e);
      } finally {
        setLoadingQuotes(false);
      }
    })();
  }, [positions]);

  /* ================================
     更新工具
  ================================= */
  const updatePositions = (fn: (prev: Position[]) => Position[]) => {
    setPositions((prev) => {
      const next = fn(prev);
      savePositions(next);
      return next;
    });
  };

  const handleAddPosition = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return alert("請輸入股票代號");

    const price = Number(newPrice);
    const shares = Number(newShares);

    if (!Number.isFinite(price) || price <= 0) return alert("請輸入正確價格");
    if (!Number.isFinite(shares) || shares <= 0) return alert("請輸入正確股數");

    const trade: Trade = { id: createId(), date: newDate, price, shares };

    updatePositions((prev) => {
      const idx = prev.findIndex((p) => p.symbol === symbol);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].trades.push(trade);
        return next;
      }
      return [...prev, { symbol, trades: [trade] }];
    });

    setNewSymbol("");
    setNewPrice("");
    setNewShares("");
    setNewDate(new Date().toISOString().slice(0, 10));
  };

  const handleDeletePosition = (symbol: string) => {
    if (!confirm(`確定要刪除 ${symbol} 所有紀錄？`)) return;

    updatePositions((prev) => prev.filter((p) => p.symbol !== symbol));
    if (expandedSymbol === symbol) setExpandedSymbol(null);
  };

  const handleTradeFieldChange = (
    symbol: string,
    tradeId: string,
    field: keyof Trade,
    value: string
  ) => {
    updatePositions((prev) =>
      prev.map((p) => {
        if (p.symbol !== symbol) return p;

        return {
          ...p,
          trades: p.trades.map((t) => {
            if (t.id !== tradeId) return t;

            if (field === "price" || field === "shares") {
              const num = Number(value);
              return { ...t, [field]: Number.isFinite(num) ? num : t[field] };
            }
            return { ...t, [field]: value };
          }),
        };
      })
    );
  };

  const handleDeleteTrade = (symbol: string, tradeId: string) => {
    updatePositions((prev) =>
      prev
        .map((p) =>
          p.symbol === symbol ? { ...p, trades: p.trades.filter((t) => t.id !== tradeId) } : p
        )
        .filter((p) => p.trades.length > 0)
    );
  };

  const handleAddDetailTrade = (symbol: string) => {
    const price = Number(detailPrice);
    const shares = Number(detailShares);
    if (price <= 0) return alert("價格錯誤");
    if (shares <= 0) return alert("股數錯誤");

    const trade: Trade = {
      id: createId(),
      date: detailDate,
      price,
      shares,
    };

    updatePositions((prev) =>
      prev.map((p) =>
        p.symbol === symbol ? { ...p, trades: [...p.trades, trade] } : p
      )
    );

    setDetailPrice("");
    setDetailShares("");
    setDetailDate(new Date().toISOString().slice(0, 10));
  };

  /* ================================
     計算總結
  ================================= */
  const totalSummary = useMemo(() => {
    return positions.reduce(
      (acc, p) => {
        const stats = computeStats(p, quotes[p.symbol] ?? null);
        acc.totalCost += stats.totalCost;
        if (stats.marketValue != null) acc.marketValue += stats.marketValue;
        if (stats.pnl != null) acc.pnl += stats.pnl;
        return acc;
      },
      { totalCost: 0, marketValue: 0, pnl: 0 }
    );
  }, [positions, quotes]);

  const fmt = (n: number | null, d = 2) =>
    n == null || !Number.isFinite(n) ? "-" : n.toFixed(d);

  /* ================================
     JSX
  ================================= */
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-10">

      {/* 標題 */}
      <header className="pb-4 border-b border-neutral-800">
        <h1 className="text-3xl font-bold">持股追蹤</h1>
        <p className="text-sm text-neutral-400">
          所有資料皆儲存在你的瀏覽器（localStorage），不會上傳到伺服器。
        </p>
      </header>

      {/* 新增持股 */}
      <section className="tv-card">
        <h2 className="text-lg font-semibold mb-4">新增持股</h2>

        <div className="space-y-5">
          <div className="form-field">
            <label className="form-label">股票代號</label>
            <input
              className="tv-input"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="例如：AAPL"
            />
          </div>

          <div className="form-field">
            <label className="form-label">買進日期</label>
            <input
              type="date"
              className="tv-input"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">買入價格（每股）</label>
            <input
              type="number"
              className="tv-input"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">買入股數</label>
            <input
              type="number"
              className="tv-input"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
            />
          </div>

          <button onClick={handleAddPosition} className="btn-primary w-full">
            新增持股
          </button>
        </div>
      </section>

      {/* 主表格—使用 tv-table-scroll 包住 table 避免 overflow */}
      <section className="tv-card">
        <div className="tv-table-scroll">
          <table className="table-dark min-w-[900px] text-sm">
            <thead>
              <tr>
                <th>代號</th>
                <th>最早買進日</th>
                <th className="text-right">均價</th>
                <th className="text-right">總股數</th>
                <th className="text-right">總成本</th>
                <th className="text-right">現價</th>
                <th className="text-right">損益</th>
                <th className="text-right">損益（%）</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>

            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-neutral-500">
                    尚未新增任何持股，可先從「投資規劃」頁加入或於上方新增。
                  </td>
                </tr>
              ) : (
                positions.map((p) => {
                  const price = quotes[p.symbol] ?? null;
                  const stats = computeStats(p, price);

                  return (
                    <Fragment key={p.symbol}>
                      <tr className="hover:bg-neutral-800/30">
                        <td>{p.symbol}</td>
                        <td>{stats.earliestDate || "-"}</td>
                        <td className="text-right">{fmt(stats.avgPrice)}</td>
                        <td className="text-right">{stats.totalShares}</td>
                        <td className="text-right">{fmt(stats.totalCost)}</td>
                        <td className="text-right">{fmt(price)}</td>
                        <td className="text-right">
                          {stats.pnl != null ? (
                            <span className={stats.pnl > 0 ? "text-emerald-400" : "text-red-400"}>
                              {fmt(stats.pnl)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="text-right">
                          {stats.pnlPct != null ? (
                            <span className={stats.pnlPct > 0 ? "text-emerald-400" : "text-red-400"}>
                              {fmt(stats.pnlPct)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="text-right space-x-2">
                          <button
                            className="btn-outline text-xs"
                            onClick={() =>
                              setExpandedSymbol(expandedSymbol === p.symbol ? null : p.symbol)
                            }
                          >
                            {expandedSymbol === p.symbol ? "收合明細" : "編輯明細"}
                          </button>

                          <button
                            className="btn-danger text-xs"
                            onClick={() => handleDeletePosition(p.symbol)}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>

                      {/* 展開明細 */}
                      {expandedSymbol === p.symbol && (
                        <tr className="detail-row">
                          <td colSpan={9} className="py-4 px-4">
                            <h3 className="text-sm text-neutral-300 mb-2">
                              交易明細
                            </h3>

                            <table className="w-full text-xs">
                              <thead>
                                <tr>
                                  <th className="text-left">日期</th>
                                  <th className="text-right">價格</th>
                                  <th className="text-right">股數</th>
                                  <th className="text-right">小計</th>
                                  <th className="text-right">操作</th>
                                </tr>
                              </thead>

                              <tbody>
                                {p.trades.map((t) => (
                                  <tr key={t.id} className="border-b border-neutral-700">
                                    <td>
                                      <input
                                        type="date"
                                        className="tv-input text-xs"
                                        value={t.date}
                                        onChange={(e) =>
                                          handleTradeFieldChange(
                                            p.symbol,
                                            t.id,
                                            "date",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </td>

                                    <td className="text-right">
                                      <input
                                        type="number"
                                        className="tv-input text-xs w-24 text-right"
                                        value={t.price}
                                        onChange={(e) =>
                                          handleTradeFieldChange(
                                            p.symbol,
                                            t.id,
                                            "price",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </td>

                                    <td className="text-right">
                                      <input
                                        type="number"
                                        className="tv-input text-xs w-24 text-right"
                                        value={t.shares}
                                        onChange={(e) =>
                                          handleTradeFieldChange(
                                            p.symbol,
                                            t.id,
                                            "shares",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </td>

                                    <td className="text-right">{fmt(t.price * t.shares)}</td>

                                    <td className="text-right">
                                      <button
                                        className="btn-danger text-xs"
                                        onClick={() => handleDeleteTrade(p.symbol, t.id)}
                                      >
                                        刪除
                                      </button>
                                    </td>
                                  </tr>
                                ))}

                                {/* 新增一筆 */}
                                <tr>
                                  <td>
                                    <input
                                      type="date"
                                      className="tv-input text-xs"
                                      value={detailDate}
                                      onChange={(e) => setDetailDate(e.target.value)}
                                    />
                                  </td>

                                  <td className="text-right">
                                    <input
                                      type="number"
                                      className="tv-input text-xs w-24 text-right"
                                      value={detailPrice}
                                      onChange={(e) => setDetailPrice(e.target.value)}
                                      placeholder="價格"
                                    />
                                  </td>

                                  <td className="text-right">
                                    <input
                                      type="number"
                                      className="tv-input text-xs w-24 text-right"
                                      value={detailShares}
                                      onChange={(e) => setDetailShares(e.target.value)}
                                      placeholder="股數"
                                    />
                                  </td>

                                  <td />

                                  <td className="text-right">
                                    <button
                                      className="btn-outline text-xs"
                                      onClick={() => handleAddDetailTrade(p.symbol)}
                                    >
                                      新增
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
