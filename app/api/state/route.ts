import { env } from "cloudflare:workers";

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

async function ensureTable() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function GET() {
  await ensureTable();
  const row = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").first<{ data: string }>();
  if (!row) {
    await env.DB.prepare("INSERT INTO app_state (id, data) VALUES (1, ?)")
      .bind(JSON.stringify(seed)).run();
    return Response.json(seed);
  }
  return Response.json(JSON.parse(row.data));
}

export async function PUT(request: Request) {
  await ensureTable();
  const value = await request.json();
  if (!value || !Array.isArray(value.companies)) {
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }
  await env.DB.prepare(`
    INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP
  `).bind(JSON.stringify(value)).run();
  return Response.json({ ok: true });
}
