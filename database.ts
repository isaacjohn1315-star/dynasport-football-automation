import { getDb } from "@/lib/db";

export async function initializeDatabase() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS posted_events (
      id SERIAL PRIMARY KEY,
      event_key TEXT UNIQUE NOT NULL,
      fixture_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_minute INTEGER,
      team_name TEXT,
      player_name TEXT,
      event_data JSONB,
      posted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
