export default function MethodologyPage() {
  return (
    <div className="content-page">
      <header className="page-heading">
        <span className="section-kicker">METHODOLOGY</span>
        <h1>分析方法</h1>
        <p>
          SignalDesk的目的不是預測明天的股價，而是縮小研究範圍。每一個結果都必須保留原始來源，讓使用者可以自行查證。
        </p>
      </header>

      <section className="info-grid">
        <article className="info-card">
          <span className="number">01 · COLLECT</span>
          <h2>收集事件</h2>
          <p>彙整Finnhub財經新聞、白宮與聯準會官方發布，以及經授權的Reddit與X資料。</p>
        </article>
        <article className="info-card">
          <span className="number">02 · MATCH</span>
          <h2>對應公司</h2>
          <p>透過公司名稱、股票代號與產品關鍵字，把消息對應至美股公司；無法明確對應時不強行推薦。</p>
        </article>
        <article className="info-card">
          <span className="number">03 · VERIFY</span>
          <h2>交叉驗證</h2>
          <p>官方來源權重最高；新聞與社群訊息需要多來源同時出現，才會提高信心程度。</p>
        </article>
        <article className="info-card">
          <span className="number">04 · RANK</span>
          <h2>產生關注排行</h2>
          <p>綜合來源可信度、事件新鮮度、社群討論強度及多來源一致性，產生0至100的關注分。</p>
        </article>
      </section>

      <section className="formula-card">
        <span className="section-kicker">ATTENTION SCORE</span>
        <div className="formula">關注分 = 事件權重 + 時效性 + 社群強度 + 交叉來源加權</div>
        <p>
          分數表示「值得投入研究時間的程度」，不代表預期報酬、上漲機率或買進建議。正向、負向與多空交錯訊號都可能獲得高關注分。
        </p>
      </section>
    </div>
  );
}
