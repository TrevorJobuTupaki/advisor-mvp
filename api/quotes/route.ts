import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "symbols is required" }, { status: 400 });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });
  }

  const symbolList = symbols.split(",");

  const quotes: Record<string, any> = {};

  for (const s of symbolList) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${s}&token=${API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();

      quotes[s] = {
        price: data.c,
        changePct: data.dp,
      };
    } catch (err) {
      quotes[s] = null;
    }
  }

  return NextResponse.json({ quotes });
}
