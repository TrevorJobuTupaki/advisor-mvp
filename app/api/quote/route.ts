import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { symbols } = (await req.json()) as { symbols: string[] };

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FINNHUB_API_KEY 未設定" },
        { status: 500 }
      );
    }

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ quotes: {} });
    }

    const results: Record<string, number | null> = {};

    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
            sym
          )}&token=${apiKey}`;
          const resp = await fetch(url);
          if (!resp.ok) {
            results[sym] = null;
            return;
          }
          const data = await resp.json();
          const price =
            data && typeof data.c === "number" ? (data.c as number) : null;
          results[sym] = price;
        } catch {
          results[sym] = null;
        }
      })
    );

    return NextResponse.json({ quotes: results });
  } catch (err: any) {
    console.error("quote API error", err);
    return NextResponse.json(
      { error: err.message || "quote error" },
      { status: 500 }
    );
  }
}
