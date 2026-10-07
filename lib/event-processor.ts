import { getDb } from "@/lib/db";
import {
  FootballFixture,
  FootballEvent,
} from "@/lib/events";
import { getLifecycleEvents } from "@/lib/lifecycle";

export type ProcessedEvent = {
  eventKey: string;
  eventType: string;
  eventMinute: number | null;
  eventData: Record<string, unknown>;
};

const CLAIM_DURATION_MS =
  20 * 60 * 1000;

function createClaimToken(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeEvent(
  event: FootballEvent
): ProcessedEvent | null {
  if (
    !event.eventKey ||
    !event.eventType
  ) {
    return null;
  }

  return {
    eventKey: event.eventKey,
    eventType: event.eventType,
    eventMinute:
      typeof event.eventMinute ===
      "number"
        ? event.eventMinute
        : null,
    eventData:
      event.eventData &&
      typeof event.eventData ===
        "object"
        ? event.eventData
        : {},
  };
}

/**
 * Atomically claims newly discovered events.
 *
 * If two Cron executions run at the same time,
 * only one execution can successfully claim an event.
 *
 * If Facebook posting fails, the claim expires and
 * a later Cron execution can retry the event.
 */
export async function getNewEvents(
  fixture: FootballFixture
): Promise<ProcessedEvent[]> {
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !== "number"
  ) {
    return [];
  }

  const lifecycleEvents =
    await getLifecycleEvents(
      fixture
    );

  if (
    lifecycleEvents.length === 0
  ) {
    return [];
  }

  const sql = getDb();

  const claimedEvents: ProcessedEvent[] =
    [];

  const claimExpiresAt =
    new Date(
      Date.now() +
        CLAIM_DURATION_MS
    );

  for (
    const lifecycleEvent of lifecycleEvents
  ) {
    const event =
      normalizeEvent(
        lifecycleEvent
      );

    if (!event) {
      continue;
    }

    const claimToken =
      createClaimToken();

    const rows =
      await sql`
        INSERT INTO posted_events (
          fixture_id,
          event_key,
          event_type,
          event_minute,
          event_data,
          status,
          claim_token,
          claim_expires_at,
          claimed_at,
          updated_at
        )
        VALUES (
          ${fixtureId},
          ${event.eventKey},
          ${event.eventType},
          ${event.eventMinute},
          ${JSON.stringify(
            event.eventData
          )}::jsonb,
          'claimed',
          ${claimToken},
          ${claimExpiresAt},
          NOW(),
          NOW()
        )
        ON CONFLICT (event_key)
        DO UPDATE SET
          status = 'claimed',
          claim_token =
            EXCLUDED.claim_token,
          claim_expires_at =
            EXCLUDED.claim_expires_at,
          claimed_at =
            NOW(),
          updated_at =
            NOW()
        WHERE posted_events.status != 'posted'
          AND (
            posted_events.claim_expires_at IS NULL
            OR posted_events.claim_expires_at < NOW()
          )
        RETURNING
          event_key,
          claim_token
      `;

    if (
      rows.length === 0
    ) {
      continue;
    }

    claimedEvents.push(
      event
    );
  }

  return claimedEvents;
}

/**
 * Marks an event as successfully published.
 *
 * The Facebook post ID is stored so the database contains
 * the relationship between the detected football event
 * and the actual Facebook publication.
 */
export async function markEventAsPosted(
  event: ProcessedEvent,
  facebookPostId?: string | null
): Promise<boolean> {
  const sql = getDb();

  const rows =
    await sql`
      UPDATE posted_events
      SET
        status = 'posted',
        facebook_post_id =
          ${facebookPostId ?? null},
        posted_at = NOW(),
        claim_token = NULL,
        claim_expires_at = NULL,
        updated_at = NOW()
      WHERE event_key = ${event.eventKey}
        AND status = 'claimed'
      RETURNING event_key
    `;

  return rows.length > 0;
}
