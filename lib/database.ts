import { getDb } from "@/lib/db";

export async function initializeDatabase() {
  const sql = getDb();

  /*
   * Stores every event that has successfully
   * been published to Facebook.
   *
   * event_key is unique so the same football
   * event cannot be permanently recorded twice.
   */
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

  /*
   * These indexes make repeated Cron checks
   * considerably cheaper as the table grows.
   */

  await sql`
    CREATE INDEX IF NOT EXISTS
    posted_events_fixture_id_idx
    ON posted_events (fixture_id);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS
    posted_events_posted_at_idx
    ON posted_events (posted_at);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS
    posted_events_event_type_idx
    ON posted_events (event_type);
  `;
}
