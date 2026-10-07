import { getDb } from "@/lib/db";

export async function initializeDatabase() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS posted_events (
      id BIGSERIAL PRIMARY KEY,

      fixture_id BIGINT NOT NULL,
      event_key TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,

      event_minute INTEGER,
      event_data JSONB NOT NULL DEFAULT '{}'::jsonb,

      status TEXT NOT NULL DEFAULT 'claimed',

      facebook_post_id TEXT,

      claim_token TEXT,
      claim_expires_at TIMESTAMPTZ,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      claimed_at TIMESTAMPTZ,
      posted_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_posted_events_fixture_id
    ON posted_events (fixture_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_posted_events_status
    ON posted_events (status)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_posted_events_claim_expires
    ON posted_events (claim_expires_at)
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS event_data JSONB NOT NULL DEFAULT '{}'::jsonb
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'claimed'
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS facebook_post_id TEXT
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS claim_token TEXT
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ
  `;

  await sql`
    ALTER TABLE posted_events
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    UPDATE posted_events
    SET
      status = 'posted',
      posted_at = COALESCE(posted_at, created_at),
      updated_at = NOW()
    WHERE status = 'claimed'
      AND facebook_post_id IS NOT NULL
  `;
}
