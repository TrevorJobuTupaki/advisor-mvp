"use client";

import { useState } from "react";

type Horizon = "short" | "medium" | "long";

type GoalOption = {
  value: string;
  label: string;
};

const HORIZON_OPTIONS: { value: Horizon; label: string; desc: string }[] = [
  {
    value: "short",
    label: "短期（幾週內）",
    desc: "偏交易、波動大，適合用閒錢短打。",
  },
  {
    value: "medium",
    label: "中期（1–6 個月）",
    desc: "可接受中度波動，追求合理報酬。",
  },
  {
    value: "long",
    label: "長期（半年–3 年）",
    desc: "注重基本面與產業趨勢，較穩健。",
  },
];

const GOAL_BY_HORIZON: Record<Horizon, GoalOption[]> = {
  short: [
    { value: "m5", label: "月 5% 左右（較保守）" },
    { value: "m10", label: "月 10%（中高風險）" },
    { value: "m20", label: "月 20%（極高風險）" },
  ],
  medium: [
    { value: "m3", label: "月 3%（穩健）" },
    { value: "m5", label: "月 5%（中等風險）" },
    { value: "m8", label: "月 8%（高風險）" },
  ],
  long: [
    { value: "y5", label: "年 5%（接近大盤）" },
    { value: "y10", label: "年 10%（積極但合理）" },
    { value: "y15", label: "年 15%（相當積極）" },
  ],
};

const RISK_OPTIONS = [
  { value: "conservative", label: "保守：重視下跌風險，報酬較低可接受" },
  { value: "balanced", label: "穩健：報酬與風險取得平衡" },
  { value: "aggressive", label: "積極：承受大波動以追求更高報酬" },
];

// ===== 追蹤資料結構 =====
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

type PlanTicker = {
  symbol: string;
  reason: string;
};

// ===== localStorage 工具 =====

const POSITIONS_KEY = "positions";

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

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addTradeToPositions(symbol: string, trade: Trade) {
  const symbolUpper = symbol.trim().toUpperCase();
  if (!symbolUpper) return;

  const positions = loadPositions();
  const idx = positions.findIndex((p) => p.symbol === symbolUpper);

  if (idx >= 0) {
    const next = [...positions];
    next[idx] = {
      ...next[idx],
      trades: [...next[idx].trades, trade],
    };
    savePositions(next);
  } else {
    const next = [
      ...positions,
      {
        symbol: symbolUpper,
        trades: [trade],
      },
    ];
    savePositions(next);
  }
}

export default function PlanningPage() {
  const [horizon, setHorizon] = useState<Horizon>("short");
  const [goal, setGoal] = useState<string>(GOAL_BY_HORIZON["short"][0].value);
  const [risk, setRisk] = useState<string>("balanced");
  const [inputNote, setInputNote] = useState<string>("");

  const [initialAmount, setInitialAmount] = useState<string>("");
  const [addEveryMonth, setAddEveryMonth] = useState<"no" | "yes">("no");
  const [monthlyAmount, setMonthlyAmount] = useState<string>("");

  const [plan, setPlan] = useState<string>("");
  const [tickers, setTickers] = useState<PlanTicker[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 「加入追蹤」時用的表單 state
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [tradePrice, setTradePrice] = useState<string>("");
  const [tradeShares, setTradeShares] = useState<string>("");

  const goalOptions = GOAL_BY_HORIZON[horizon];
  const horizonDesc =
    HORIZON_OPTIONS.find((h) => h.value === horizon)?.desc ?? "";

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setPlan("");
    setTickers([]);

    if (!initialAmount.trim()) {
      setLoading(false);
      setErrorMsg("請輸入初始投資金額（美元）。");
      return;
    }
    if (addEveryMonth === "yes" && !monthlyAmount.trim()) {
      setLoading(false);
      setErrorMsg("請輸入每月預計追加投資金額（美元），或改選擇不固定加碼。");
      return;
    }

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          horizon,
          goal,
          risk,
          note: inputNote,
          initialAmount,
          addEveryMonth: addEveryMonth === "yes",
          monthlyAmount: addEveryMonth === "yes" ? monthlyAmount : "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "產生規劃時發生錯誤");
      }

      const data = (await res.json()) as {
        plan?: string;
        tickers?: PlanTicker[];
      };

      setPlan(data.plan || "");
      setTickers(Array.isArray(data.tickers) ? data.tickers : []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "產生規劃失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const openAddTradeForm = (symbol: string) => {
    setActiveSymbol(symbol);
    setTradeDate(new Date().toISOString().slice(0, 10));
    setTradePrice("");
    setTradeShares("");
  };

  const handleConfirmAddTrade = () => {
    if (!activeSymbol) return;

    const priceNum = Number(tradePrice);
    const sharesNum = Number(tradeShares);

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      alert("請輸入正確的買入價格（每股）。");
      return;
    }
    if (!Number.isFinite(sharesNum) || sharesNum <= 0) {
      alert("請輸入正確的買入股數。");
      return;
    }
    if (!tradeDate) {
      alert("請選擇買進日期。");
      return;
    }

    const trade: Trade = {
      id: createId(),
      date: tradeDate,
      price: priceNum,
      shares: sharesNum,
    };

    addTradeToPositions(activeSymbol, trade);
    setActiveSymbol(null);
    setTradePrice("");
    setTradeShares("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      {/* 頂部標題 + 小提示，走 TradingView 風格 */}
      <header className="space-y-3 border-b border-neutral-800 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              投資規劃 <span className="text-sm text-neutral-400">（美股）</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-300">
              輸入你的投報週期、目標報酬與風險承受度，系統會請 GPT 產生客製化投資規劃，
              並推薦可追蹤標的。
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Demo / 本地儲存
            </span>
          </div>
        </div>
      </header>

      {/* 主內容：左設定、右規劃文字 */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        {/* 左側：設定表單（卡片） */}
        <section className="rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-black/80 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.65)] space-y-6">
          {/* 投報週期 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              投報週期
            </label>
            <select
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
              value={horizon}
              onChange={(e) => {
                const v = e.target.value as Horizon;
                setHorizon(v);
                setGoal(GOAL_BY_HORIZON[v][0].value);
              }}
            >
              {HORIZON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {horizonDesc && (
              <p className="text-xs text-neutral-400">{horizonDesc}</p>
            )}
          </div>

          {/* 投報目標 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              投報目標
            </label>
            <select
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              {goalOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 風險承受度 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              風險承受度
            </label>
            <select
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
            >
              {RISK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 初始投資金額 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              初始投資金額（美元）
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              placeholder="例如：5000"
            />
            <p className="text-xs text-neutral-500">
              寫大約金額即可，主要用來估算風險與合理報酬範圍。
            </p>
          </div>

          {/* 是否每月持續投入 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              後續是否每月持續投入？
            </label>
            <div className="flex flex-col gap-2 text-sm md:flex-row">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  className="accent-emerald-500"
                  value="no"
                  checked={addEveryMonth === "no"}
                  onChange={() => setAddEveryMonth("no")}
                />
                不一定／暫時不固定加碼
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  className="accent-emerald-500"
                  value="yes"
                  checked={addEveryMonth === "yes"}
                  onChange={() => setAddEveryMonth("yes")}
                />
                是，每月固定投入
              </label>
            </div>

            {addEveryMonth === "yes" && (
              <div className="space-y-2 mt-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  每月預計追加投資金額（美元）
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="例如：500"
                />
                <p className="text-xs text-neutral-500">
                  GPT 會同時考慮「單筆 + 每月定期投入」，模擬資產成長路徑。
                </p>
              </div>
            )}
          </div>

          {/* 補充說明 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              補充說明（選填）
            </label>
            <textarea
              className="w-full min-w-[280px] md:min-w-[350px] rounded-md bg-neutral-900 px-3 py-2 text-sm border border-neutral-700 min-h-[120px] resize-y"
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              placeholder="例如：是否可接受槓桿、目前已有持股類型、產業偏好、避險需求…"
            ></textarea>

          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-800/70 mt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "產生規劃中…" : "產生投資規劃"}
            </button>
          </div>
        </section>

        {/* 右側：GPT 規劃文字 */}
        <section className="rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-black/80 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.6)] space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">
            GPT 投資規劃建議
          </h2>
          <p className="text-xs text-neutral-400">
            送出表單後，這裡會顯示 GPT 產生的說明文字與資產配置建議。可對照下方「建議追蹤標的」實際操作。
          </p>

          <div className="mt-2 h-[260px] overflow-y-auto rounded-lg border border-neutral-800 bg-black/60 p-3 text-sm whitespace-pre-wrap">
            {plan ? (
              plan
            ) : (
              <span className="text-neutral-500">
                尚未產生投資規劃，請先在左側填寫條件並送出表單。
              </span>
            )}
          </div>
        </section>
      </div>

      {/* 錯誤訊息 */}
      {errorMsg && (
        <div className="rounded-lg border border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errorMsg}
        </div>
      )}

      {/* 建議追蹤標的 */}
      {tickers.length > 0 && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.55)] space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">
            建議追蹤的美股標的
          </h3>
          <p className="text-xs text-neutral-400">
            點「加入追蹤」會要求輸入買進日期、價格與股數，並寫入「持股追蹤」頁面的紀錄。
          </p>

          <div className="flex flex-col gap-3">
            {tickers.map((t) => (
              <div
                key={t.symbol}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-neutral-800 rounded-lg px-3 py-2 bg-black/40"
              >
                <div>
                  <div className="font-mono text-sm font-semibold">
                    {t.symbol.toUpperCase()}
                  </div>
                  {t.reason && (
                    <div className="text-xs text-neutral-400 mt-1">
                      {t.reason}
                    </div>
                  )}
                </div>

                <div className="flex-1" />

                {activeSymbol === t.symbol ? (
                  <div className="flex flex-col md:flex-row gap-2 items-center text-xs">
                    <input
                      type="date"
                      value={tradeDate}
                      onChange={(e) => setTradeDate(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="買入價格"
                      value={tradePrice}
                      onChange={(e) => setTradePrice(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 w-24 text-right"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="股數"
                      value={tradeShares}
                      onChange={(e) => setTradeShares(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 w-20 text-right"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmAddTrade}
                      className="px-3 py-1 rounded-md bg-emerald-500 text-black hover:bg-emerald-400"
                    >
                      確認加入追蹤
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSymbol(null)}
                      className="px-2 py-1 rounded-md border border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAddTradeForm(t.symbol)}
                    className="self-start md:self-auto px-3 py-1 text-xs rounded-md bg-emerald-500 text-black hover:bg-emerald-400"
                  >
                    加入追蹤
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
