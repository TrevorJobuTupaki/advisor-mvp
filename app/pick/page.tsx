"use client";

import { useEffect, useState } from "react";

/* ===========================
   型別
=========================== */
type Horizon = "short" | "medium" | "long";
type GoalOption = { value: string; label: string };
type Trade = { id: string; date: string; price: number; shares: number };
type PlanTicker = { symbol: string; reason: string };

/* ===========================
   選項
=========================== */
const HORIZON_OPTIONS = [
  { value: "short", label: "短期（幾週內）", desc: "偏交易、波動大，適合短打。" },
  { value: "medium", label: "中期（1–6 個月）", desc: "可接受中度波動，追求合理報酬。" },
  { value: "long", label: "長期（半年–3 年）", desc: "注重基本面與產業趨勢，較穩健。" },
] as const;

const GOAL_BY_HORIZON: Record<Horizon, GoalOption[]> = {
  short: [
    { value: "m5", label: "月 5% 左右（保守）" },
    { value: "m10", label: "月 10%（中高風險）" },
    { value: "m20", label: "月 20%（高風險）" },
  ],
  medium: [
    { value: "m3", label: "月 3%（穩健）" },
    { value: "m5", label: "月 5%（中等風險）" },
    { value: "m8", label: "月 8%（較高風險）" },
  ],
  long: [
    { value: "y5", label: "年 5%（大盤等級）" },
    { value: "y10", label: "年 10%（積極）" },
    { value: "y15", label: "年 15%（高積極）" },
  ],
};

const RISK_OPTIONS = [
  { value: "conservative", label: "保守（重視下跌風險）" },
  { value: "balanced", label: "穩健（風險與報酬平衡）" },
  { value: "aggressive", label: "積極（可承受大波動）" },
];

/* ===========================
   LocalStorage Keys
=========================== */
const PLAN_KEY = "investment_plan";
const TICKER_KEY = "investment_tickers";

/* ===========================
   LocalStorage Helpers
=========================== */
function loadSavedPlan() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PLAN_KEY) || "";
}

function loadSavedTickers(): PlanTicker[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TICKER_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePlan(plan: string) {
  localStorage.setItem(PLAN_KEY, plan);
}

function saveTickers(tickers: PlanTicker[]) {
  localStorage.setItem(TICKER_KEY, JSON.stringify(tickers));
}

/* ===========================
   加入追蹤
=========================== */
const POSITIONS_KEY = "positions";

function loadPositions() {
  try {
    return JSON.parse(localStorage.getItem(POSITIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePositions(positions: any[]) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
}

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ===========================
   主程式
=========================== */
export default function PlanningPage() {
  const [horizon, setHorizon] = useState<Horizon>("short");
  const [goal, setGoal] = useState(GOAL_BY_HORIZON["short"][0].value);
  const [risk, setRisk] = useState("balanced");
  const [inputNote, setInputNote] = useState("");

  const [initialAmount, setInitialAmount] = useState("");
  const [addEveryMonth, setAddEveryMonth] = useState<"no" | "yes">("no");
  const [monthlyAmount, setMonthlyAmount] = useState("");

  /* GPT 回傳區 */
  const [plan, setPlan] = useState("");
  const [tickers, setTickers] = useState<PlanTicker[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* 加入追蹤用 */
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tradePrice, setTradePrice] = useState("");
  const [tradeShares, setTradeShares] = useState("");

  const horizonDesc = HORIZON_OPTIONS.find((h) => h.value === horizon)?.desc;
  const goalOptions = GOAL_BY_HORIZON[horizon];

  /* ===========================
     1) 載入 localStorage（保留 GPT 規劃）
  ============================ */
  useEffect(() => {
    const savedPlan = loadSavedPlan();
    const savedTickers = loadSavedTickers();

    if (savedPlan) setPlan(savedPlan);
    if (savedTickers.length > 0) setTickers(savedTickers);
  }, []);

  /* ===========================
     2) 產生投資規劃（呼叫 API）
  ============================ */
  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!initialAmount.trim()) {
      setErrorMsg("請輸入初始投資金額");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horizon,
          goal,
          risk,
          note: inputNote,
          initialAmount,
          addEveryMonth: addEveryMonth === "yes",
          monthlyAmount,
        }),
      });

      const data = await res.json();

      setPlan(data.plan || "");
      setTickers(data.tickers || []);

      savePlan(data.plan || "");
      saveTickers(data.tickers || []);
    } catch {
      setErrorMsg("產生規劃時發生錯誤");
    }

    setLoading(false);
  };

  /* ===========================
     清除規劃
  ============================ */
  const handleClear = () => {
    setPlan("");
    setTickers([]);
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(TICKER_KEY);
  };

  /* ===========================
     加入追蹤
  ============================ */
  function addTradeToPositions(symbol: string, trade: Trade) {
    const s = symbol.toUpperCase();
    const positions = loadPositions();
    const idx = positions.findIndex((p: any) => p.symbol === s);

    if (idx >= 0) positions[idx].trades.push(trade);
    else positions.push({ symbol: s, trades: [trade] });

    savePositions(positions);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-10">

      {/* 標題 */}
      <header className="pb-5 border-b border-neutral-800">
        <h1 className="text-3xl font-semibold">投資規劃</h1>
        <p className="text-neutral-400 mt-1 text-sm">輸入資訊 → 自動產生 GPT 投資規劃</p>
      </header>

      {/* 主內容 */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">

        {/* 左側表單 */}
        <section className="tv-card space-y-6">

          {/* 投報週期 */}
          <div className="form-field">
            <label className="form-label">投報週期</label>
            <select
              className="tv-input"
              value={horizon}
              onChange={(e) => {
                const v = e.target.value as Horizon;
                setHorizon(v);
                setGoal(GOAL_BY_HORIZON[v][0].value);
              }}
            >
              {HORIZON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">{horizonDesc}</p>
          </div>

          {/* 投報目標 */}
          <div className="form-field">
            <label className="form-label">投報目標</label>
            <select className="tv-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {goalOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 風險承受度 */}
          <div className="form-field">
            <label className="form-label">風險承受度</label>
            <select className="tv-input" value={risk} onChange={(e) => setRisk(e.target.value)}>
              {RISK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 初始投資金額 */}
          <div className="form-field">
            <label className="form-label">初始投資金額（USD）</label>
            <input
              className="tv-input"
              type="number"
              placeholder="例如 5000"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
            />
          </div>

          {/* 每月投入 */}
          <div className="form-field">
            <label className="form-label">每月持續投入？</label>

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={addEveryMonth === "no"}
                  onChange={() => setAddEveryMonth("no")}
                />
                不固定
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={addEveryMonth === "yes"}
                  onChange={() => setAddEveryMonth("yes")}
                />
                是，每月投入
              </label>
            </div>

            {addEveryMonth === "yes" && (
              <input
                className="tv-input"
                type="number"
                placeholder="例如 300"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
              />
            )}
          </div>

          {/* 補充說明 */}
          <div className="form-field">
            <label className="form-label">補充說明（選填）</label>
            <textarea
              className="tv-input min-h-[140px]"
              placeholder="產業偏好、槓桿、目前持股…"
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
            />
          </div>

          {/* 產生按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "處理中…" : "產生投資規劃"}
          </button>

          {errorMsg && (
            <div className="border border-red-500 text-red-300 p-2 rounded">
              {errorMsg}
            </div>
          )}
        </section>

        {/* 右側 GPT 結果 */}
        <section className="tv-card space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase">
              GPT 投資規劃建議
            </h2>

            {plan && (
              <button
                onClick={handleClear}
                className="px-3 py-1 text-xs rounded border border-neutral-500 hover:bg-neutral-800"
              >
                清除
              </button>
            )}
          </div>

          <div className="tv-input h-[260px] overflow-y-auto p-3 whitespace-pre-wrap text-sm">
            {plan || <span className="text-neutral-500">尚未產生規劃</span>}
          </div>
        </section>
      </div>

      {/* 建議追蹤標的 */}
      {tickers.length > 0 && (
        <section className="tv-card space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase">
            建議追蹤標的
          </h3>

          <p className="text-xs text-neutral-500">
            點「加入追蹤」可輸入買進紀錄，會寫入追蹤頁面。
          </p>

          <div className="flex flex-col gap-4">
            {tickers.map((t) => (
              <div
                key={t.symbol}
                className="tv-input p-3 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <div className="font-mono text-sm font-semibold">
                    {t.symbol.toUpperCase()}
                  </div>
                  <div className="text-xs text-neutral-400">{t.reason}</div>
                </div>

                {/* 加入紀錄 */}
                {activeSymbol === t.symbol ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <input
                      type="date"
                      className="tv-input px-2 py-1 rounded"
                      value={tradeDate}
                      onChange={(e) => setTradeDate(e.target.value)}
                    />

                    <input
                      type="number"
                      placeholder="價格"
                      className="tv-input px-2 py-1 rounded w-24 text-right"
                      value={tradePrice}
                      onChange={(e) => setTradePrice(e.target.value)}
                    />

                    <input
                      type="number"
                      placeholder="股數"
                      className="tv-input px-2 py-1 rounded w-20 text-right"
                      value={tradeShares}
                      onChange={(e) => setTradeShares(e.target.value)}
                    />

                    <button
                      className="px-3 py-1 rounded bg-emerald-500 text-black hover:bg-emerald-400"
                      onClick={() => {
                        addTradeToPositions(t.symbol, {
                          id: createId(),
                          date: tradeDate,
                          price: Number(tradePrice),
                          shares: Number(tradeShares),
                        });

                        setActiveSymbol(null);
                      }}
                    >
                      確認
                    </button>

                    <button
                      className="px-2 py-1 rounded border border-neutral-600 hover:bg-neutral-800"
                      onClick={() => setActiveSymbol(null)}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-3 py-1 text-xs rounded bg-emerald-500 text-black hover:bg-emerald-400"
                    onClick={() => setActiveSymbol(t.symbol)}
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
