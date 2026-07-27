import { NextResponse } from "next/server";

const seed = {
  companies: [{
    id: "ondam",
    name: "온담도시락",
    price: 7000,
    people: [
      { id: "a", name: "A", paid: false },
      { id: "b", name: "B", paid: false },
      { id: "c", name: "C", paid: false },
      { id: "d", name: "D", paid: false },
    ],
    days: [
      { id: "0715", date: "2026-07-15", attendees: ["a", "b", "c"] },
      { id: "0716", date: "2026-07-16", attendees: ["a", "b", "c"] },
      { id: "0720", date: "2026-07-20", attendees: ["a", "b", "c", "d"] },
      { id: "0722", date: "2026-07-22", attendees: ["a", "b", "d"] },
      { id: "0724", date: "2026-07-24", attendees: ["a", "b", "d"] },
    ],
  }],
};

function config() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: `${url}/rest/v1/app_state`, key };
}

const headers = (key: string) => ({
  apikey: key,
  authorization: `Bearer ${key}`,
  "content-type": "application/json",
});

export async function GET() {
  const supabase = config();
  if (!supabase) {
    return NextResponse.json(seed, { headers: { "x-storage-mode": "local-fallback" } });
  }

  const response = await fetch(`${supabase.url}?id=eq.1&select=data`, {
    headers: headers(supabase.key),
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Database read failed" }, { status: 502 });
  const rows = await response.json() as { data: typeof seed }[];
  if (rows[0]?.data) return NextResponse.json(rows[0].data);

  await fetch(supabase.url, {
    method: "POST",
    headers: { ...headers(supabase.key), prefer: "return=minimal" },
    body: JSON.stringify({ id: 1, data: seed }),
  });
  return NextResponse.json(seed);
}

export async function PUT(request: Request) {
  const value = await request.json();
  if (!value || !Array.isArray(value.companies)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }
  const supabase = config();
  if (!supabase) return NextResponse.json({ ok: true, local: true });

  const response = await fetch(`${supabase.url}?on_conflict=id`, {
    method: "POST",
    headers: { ...headers(supabase.key), prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: 1, data: value, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) return NextResponse.json({ error: "Database write failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
