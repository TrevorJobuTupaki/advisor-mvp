"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

type Trade = {
  id: string;
  date: string; // YYYY-MM-DD
  price: number;
  shares: number;
};

type Position = {
  symbol: string;
  trades: Trade[];
};

type QuoteMap = Record<string, number | null>;

const POSITIONS_KEY = "positions";

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadPositions(): Position[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POSITIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && typeof p.symbol === "string");
  } catch (e) {
    console.error("讀取 positions 失敗：", e);
    return [];
  }
}

function savePositions(positions: Position[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  } catch (e) {
    console.error("儲存 positions 失敗：", e);
  }
}

type PositionStats = {
  earliestDate: string | null;
  totalShares: number;
  totalCost: number;
  avgPrice: number | null;
  marketValue: number | null;
  pnl: number | null;
  pnlPct: number | null;
};

function computeStats(position: Position, price: number | null): PositionStats {
  let earliestDate: string | null = null;
  let totalShares = 0;
  let totalCost = 0;

  for (const t of position.trades) {
    if (!t || !Number.isFinite(t.price) || !Number.isFinite(t.shares)) continue;
    if (!earliestDate || (t.date && t.date < earliestDate)) {
      earliestDate = t.date || earliestDate;
    }
    totalShares += t.shares;
    totalCost += t.price * t.shares;
  }

  const avgPrice =
    totalShares > 0 ? totalCost / totalShares : totalCost > 0 ? totalCost : null;

  let marketValue: number | null = null;
  let pnl: number | null = null;
  let pnlPct: number | null = null;

  if (price != null && totalShares > 0) {
    marketValue = price * totalShares;
    pnl = marketValue - totalCost;
    pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : null;
  }

  return {
    earliestDate,
    totalShares,
    totalCost,
    avgPrice,
    marketValue,
    pnl,
    pnlPct,
  };
}

export default function TrackPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // 新增持股表單（頂部）
  const [newSymbol, setNewSymbol] = useState("");
  const [newDate, setNewDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [newPrice, setNewPrice] = useState("");
  const [newShares, setNewShares] = useState("");

  // 展開編輯明細的標的
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // 展開明細時要新增的那一筆
  const [detailDate, setDetailDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [detailPrice, setDetailPrice] = useState("");
  const [detailShares, setDetailShares] = useState("");

  // 初始載入 positions
  useEffect(() => {
    setPositions(loadPositions());
  }, []);

  // 抓報價
  useEffect(() => {
    const symbols = positions.map((p) => p.symbol).filter(Boolean);
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
        if (!res.ok) throw new Error(data.error || "取得報價失敗");

        setQuotes(data.quotes || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingQuotes(false);
      }
    })();
  }, [positions]);

  const updatePositions = (updater: (prev: Position[]) => Position[]) => {
    setPositions((prev) => {
      const next = updater(prev);
      savePositions(next);
      return next;
    });
  };

  const handleAddPosition = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) {
      alert("請輸入股票代號");
      return;
    }

    const price = Number(newPrice);
    const shares = Number(newShares);

    if (!Number.isFinite(price) || price <= 0) {
      alert("請輸入正確的買入價格（每股）");
      return;
    }
    if (!Number.isFinite(shares) || shares <= 0) {
      alert("請輸入正確的買入股數");
      return;
    }
    if (!newDate) {
      alert("請選擇買進日期");
      return;
    }

    const trade: Trade = {
      id: createId(),
      date: newDate,
      price,
      shares,
    };

    updatePositions((prev) => {
      const idx = prev.findIndex((p) => p.symbol === symbol);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], trades: [...next[idx].trades, trade] };
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
    if (!window.confirm(`確定要刪除 ${symbol} 的所有持股紀錄嗎？`)) return;
    updatePositions((prev) => prev.filter((p) => p.symbol !== symbol));
    if (expandedSymbol === symbol) {
      setExpandedSymbol(null);
    }
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
            if (field === "date") {
              return { ...t, date: value };
            }
            if (field === "price") {
              const num = Number(value);
              return {
                ...t,
                price: Number.isFinite(num) ? num : t.price,
              };
            }
            if (field === "shares") {
              const num = Number(value);
              return {
                ...t,
                shares: Number.isFinite(num) ? num : t.shares,
              };
            }
            return t;
          }),
        };
      })
    );
  };

  const handleDeleteTrade = (symbol: string, tradeId: string) => {
    updatePositions((prev) =>
      prev
        .map((p) => {
          if (p.symbol !== symbol) return p;
          return {
            ...p,
            trades: p.trades.filter((t) => t.id !== tradeId),
          };
        })
        .filter((p) => p.trades.length > 0)
    );
  };

  const handleAddDetailTrade = (symbol: string) => {
    const price = Number(detailPrice);
    const shares = Number(detailShares);

    if (!Number.isFinite(price) || price <= 0) {
      alert("請輸入正確的買入價格（每股）");
      return;
    }
    if (!Number.isFinite(shares) || shares <= 0) {
      alert("請輸入正確的買入股數");
      return;
    }
    if (!detailDate) {
      alert("請選擇買進日期");
      return;
    }

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

  const totalSummary = useMemo(() => {
    return positions.reduce(
      (acc, p) => {
        const stats = computeStats(p, quotes[p.symbol] ?? null);
        acc.totalCost += stats.totalCost;
        if (stats.marketValue != null) {
          acc.marketValue += stats.marketValue;
        }
        if (stats.pnl != null) {
          acc.pnl += stats.pnl;
        }
        return acc;
      },
      { totalCost: 0, marketValue: 0, pnl: 0 }
    );
  }, [positions, quotes]);

  const totalPnLPct =
    totalSummary.totalCost > 0
      ? (totalSummary.pnl / totalSummary.totalCost) * 100
      : 0;

  const fmt = (n: number | null | undefined, digits = 2) =>
    n == null || !Number.isFinite(n) ? "-" : n.toFixed(digits);

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      {/* 標題區 */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">持股追蹤</h1>
        <p className="text-sm text-neutral-300">
          這裡只放「已實際買入」的持股，資料存在你的瀏覽器（localStorage），伺服器不會保存。
        </p>
      </header>

      {/* 摘要卡片 */}
      {positions.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="text-xs text-neutral-400">總成本（USD）</div>
            <div className="mt-1 text-xl font-semibold">
              {fmt(totalSummary.totalCost, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="text-xs text-neutral-400">目前市值（USD）</div>
            <div className="mt-1 text-xl font-semibold">
              {fmt(totalSummary.marketValue, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="text-xs text-neutral-400">總損益</div>
            <div
              className={
                "mt-1 text-xl font-semibold " +
                (totalSummary.pnl > 0
                  ? "text-emerald-400"
                  : totalSummary.pnl < 0
                  ? "text-red-400"
                  : "")
              }
            >
              {fmt(totalSummary.pnl, 2)} 美元（{fmt(totalPnLPct, 2)}%）
            </div>
            {loadingQuotes && (
              <div className="mt-1 text-[11px] text-neutral-500">
                更新報價中…
              </div>
            )}
          </div>
        </section>
      )}

      {/* 新增持股表單 */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm space-y-3">
        <div className="font-semibold">新增持股</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              股票代號
            </label>
            <input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="例如：AAPL"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              買進日期
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              買入價格（每股）
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              買入股數
            </label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex md:justify-end">
            <button
              type="button"
              onClick={handleAddPosition}
              className="mt-4 md:mt-0 px-4 py-2 text-xs rounded-md bg-emerald-500 text-black hover:bg-emerald-400"
            >
              新增持股
            </button>
          </div>
        </div>
      </section>

      {/* 持股總覽 + 編輯明細 */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-neutral-950/80">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-300">
                代號
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-300">
                最早買進日
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                均價
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                總股數
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                總成本
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                現價
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                損益
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                損益（%）
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-300">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-neutral-500 text-sm"
                >
                  目前尚未新增任何持股，可在「投資規劃」頁加入追蹤，或在上方表單新增。
                </td>
              </tr>
            ) : (
              positions.map((p, idx) => {
                const price = quotes[p.symbol] ?? null;
                const stats = computeStats(p, price);

                return (
                  <Fragment key={p.symbol}>
                    <tr
                      className={
                        "border-t border-neutral-800 " +
                        (idx % 2 === 0
                          ? "bg-black/20"
                          : "bg-black/5 hover:bg-black/20")
                      }
                    >
                      <td className="px-3 py-2 font-mono">{p.symbol}</td>
                      <td className="px-3 py-2">
                        {stats.earliestDate || "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmt(stats.avgPrice, 2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {stats.totalShares || "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmt(stats.totalCost, 2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {price == null ? "-" : fmt(price, 2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {stats.pnl != null ? (
                          <span
                            className={
                              stats.pnl > 0
                                ? "text-emerald-400"
                                : stats.pnl < 0
                                ? "text-red-400"
                                : ""
                            }
                          >
                            {fmt(stats.pnl, 2)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {stats.pnlPct != null ? (
                          <span
                            className={
                              stats.pnlPct > 0
                                ? "text-emerald-400"
                                : stats.pnlPct < 0
                                ? "text-red-400"
                                : ""
                            }
                          >
                            {fmt(stats.pnlPct, 2)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (expandedSymbol === p.symbol) {
                              setExpandedSymbol(null);
                            } else {
                              setExpandedSymbol(p.symbol);
                              setDetailDate(
                                new Date().toISOString().slice(0, 10)
                              );
                              setDetailPrice("");
                              setDetailShares("");
                            }
                          }}
                          className="px-3 py-1 text-xs rounded-md border border-neutral-500 text-neutral-200 hover:bg-neutral-700/40"
                        >
                          {expandedSymbol === p.symbol ? "收合明細" : "編輯明細"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(p.symbol)}
                          className="px-3 py-1 text-xs rounded-md border border-red-500 text-red-300 hover:bg-red-500/10"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>

                    {expandedSymbol === p.symbol && (
                      <tr className="bg-neutral-950/60 border-t border-neutral-800">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="text-xs text-neutral-400 mb-2">
                            交易明細（所有買入紀錄）：
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[700px]">
                              <thead>
                                <tr>
                                  <th className="px-2 py-1 text-left">
                                    買進日期
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    價格（每股）
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    股數
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    小計（美元）
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    操作
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.trades.map((t) => (
                                  <tr
                                    key={t.id}
                                    className="border-t border-neutral-800"
                                  >
                                    <td className="px-2 py-1">
                                      <input
                                        type="date"
                                        value={t.date || ""}
                                        onChange={(e) =>
                                          handleTradeFieldChange(
                                            p.symbol,
                                            t.id,
                                            "date",
                                            e.target.value
                                          )
                                        }
                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px]"
                                      />
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={t.price}
                                        onChange={(e) =>
                                          handleTradeFieldChange(
                                            p.symbol,
                                            t.id,
                                            "price",
                                            e.target.value
                                          )
                                        }
                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] w-24 text-right"
                                      />
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={t.shares}
                                        onChange={(e) =>
                                          handleTradeFieldChange(
                                            p.symbol,
                                            t.id,
                                            "shares",
                                            e.target.value
                                          )
                                        }
                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] w-24 text-right"
                                      />
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      {fmt(t.price * t.shares, 2)}
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteTrade(p.symbol, t.id)
                                        }
                                        className="px-2 py-0.5 rounded-md border border-red-500 text-red-300 hover:bg-red-500/10"
                                      >
                                        刪除
                                      </button>
                                    </td>
                                  </tr>
                                ))}

                                {/* 新增一筆交易 */}
                                <tr className="border-t border-neutral-800">
                                  <td className="px-2 py-2">
                                    <input
                                      type="date"
                                      value={detailDate}
                                      onChange={(e) =>
                                        setDetailDate(e.target.value)
                                      }
                                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px]"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={detailPrice}
                                      onChange={(e) =>
                                        setDetailPrice(e.target.value)
                                      }
                                      placeholder="價格"
                                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] w-24 text-right"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.0001"
                                      value={detailShares}
                                      onChange={(e) =>
                                        setDetailShares(e.target.value)
                                      }
                                      placeholder="股數"
                                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] w-24 text-right"
                                    />
                                  </td>
                                  <td className="px-2 py-2" />
                                  <td className="px-2 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAddDetailTrade(p.symbol)
                                      }
                                      className="px-3 py-1 rounded-md border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10"
                                    >
                                      新增一筆
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
