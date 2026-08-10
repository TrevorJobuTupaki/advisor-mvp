"use client";

import { FormEvent, useEffect, useState } from "react";

const WATCHLIST_KEY = "signal_watchlist";

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
    } catch {}
    const frame = requestAnimationFrame(() => setSymbols(saved));
    return () => cancelAnimationFrame(frame);
  }, []);

  function save(next: string[]) {
    setSymbols(next);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  }

  function add(event: FormEvent) {
    event.preventDefault();
    const symbol = input.trim().toUpperCase();
    if (!symbol || symbols.includes(symbol)) return;
    save([...symbols, symbol]);
    setInput("");
  }

  return (
    <div className="content-page">
      <header className="page-heading">
        <span className="section-kicker">PERSONAL WATCHLIST</span>
        <h1>我的關注</h1>
        <p>保存想持續研究的股票代號。資料只存在這台裝置的瀏覽器，不會上傳個人持股或交易紀錄。</p>
      </header>

      <form className="watch-form" onSubmit={add}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="輸入美股代號，例如 NVDA"
          aria-label="股票代號"
        />
        <button className="primary-button" type="submit">加入關注</button>
      </form>

      <div className="watch-table">
        {symbols.length ? symbols.map((symbol) => (
          <div className="watch-row" key={symbol}>
            <strong>{symbol}</strong>
            <span>回到市場雷達查看是否出現新事件訊號</span>
            <button onClick={() => save(symbols.filter((item) => item !== symbol))}>移除</button>
          </div>
        )) : (
          <div className="empty-state">尚未加入任何股票。可從市場雷達的排行直接加入。</div>
        )}
      </div>
    </div>
  );
}
