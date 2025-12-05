import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { symbol, from, lastPlans } = (await req.json()) as {
      symbol: string;
      from?: string;
      lastPlans?: string;
    };

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FINNHUB_API_KEY 未設定" },
        { status: 500 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 未設定" },
        { status: 500 }
      );
    }

    const to = new Date().toISOString().slice(0, 10);
    const fromDate =
      from ||
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
        .toISOString()
        .slice(0, 10);

    // 取得該股票近期新聞
    const newsResp = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
        symbol
      )}&from=${fromDate}&to=${to}&token=${apiKey}`
    );

    let articles: any[] = [];
    if (newsResp.ok) {
      articles = await newsResp.json();
    }

    const topArticles = articles
      .filter((a) => a && a.headline && a.datetime)
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 8);

    const newsText = topArticles.length
      ? topArticles
          .map((a) => {
            const date = new Date(a.datetime * 1000)
              .toISOString()
              .slice(0, 10);
            return `${date} - ${a.headline} (${a.source})\n${a.summary || ""}`;
          })
          .join("\n\n")
      : "查無重大新聞。";

    const prompt = `
你是一位美股投資顧問，請根據下列資訊，提供對 ${symbol} 的追蹤建議：

[持有起算日]
${fromDate}

[近期重要新聞摘要]
${newsText}

[過去給投資人的規劃與操作建議摘要（可能為空）]
${lastPlans || "（無過去建議紀錄）"}

請以繁體中文，條列說明：
1. 最近有哪些關鍵事件或新聞可能影響股價、基本面或估值。
2. 就目前狀況，持有者應偏向：續抱、逢高減碼、逢低加碼或觀望？請說明理由。
3. 簡單的風險提醒（例如：產業風險、單一事件風險、市場波動等）。
4. 建議的檢視頻率（例如：每週一次、每月一次）以及是否需要設定停損或目標價位（可以給範圍，不用精準預測）。

語氣務實冷靜，不要誇大報酬，也不要給出保證式的語句。`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "你是一位專業且保守的美股投資顧問。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const analysis =
      completion.choices[0]?.message?.content?.trim() ||
      "目前無法取得分析結果。";

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("news-analyze API error", err);
    return NextResponse.json(
      { error: err.message || "news-analyze error" },
      { status: 500 }
    );
  }
}
