import { getDb } from "@/lib/db";
import {
  FootballFixture,
  FootballEvent,
} from "@/lib/events";
import {
  getLifecycleEvents,
} from "@/lib/lifecycle";

export type ProcessedEvent = {
  eventKey: string;
  eventType: string;
  eventMinute: number | null;
  eventData: Record<string, unknown>;
};

const CLAIM_DURATION_MINUTES = 20;

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
  if (!event.eventKey) {
    return null;
  }

  return {
    eventKey: event.eventKey,
    eventType:
      event.eventType ||
      "unknown",
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

export async function getNewEvents(
  fixture: FootballFixture
): Promise<ProcessedEvent[]> {
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !==
    "number"
  ) {
    return [];
  }

  const lifecycleEvents =
    await getLifecycleEvents(
      fixture
    );

  if (
    !Array.isArray(
      lifecycleEvents
    ) ||
    lifecycleEvents.length === 0
  ) {
    return [];
  }

  const sql = getDb();

  const newEvents: ProcessedEvent[] =
    [];

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

    const claimed =
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
          NOW() + INTERVAL '${CLAIM_DURATION_MINUTES} minutes',
          NOW(),
          NOW()
        )
        ON CONFLICT (event_key)
        DO UPDATE SET
          claim_token =
            EXCLUDED.claim_token,
          claim_expires_at =
            EXCLUDED.claim_expires_at,
          claimed_at =
            EXCLUDED.claimed_at,
          updated_at =
            NOW()
        WHERE posted_events.status != 'posted'
          AND (
            posted_events.claim_expires_at IS NULL
            OR posted_events.claim_expires_at < NOW()
          )
        RETURNING event_key
      `;

    if (
      claimed.length === 0
    ) {
      continue;
    }

    newEvents.push(event);
  }

  return newEvents;
}

export async function markEventAsPosted(
  event: ProcessedEvent & {
    eventData?: Record<
      string,
      unknown
    >;
  }
): Promise<boolean> {
  const sql = getDb();

  const eventData =
    event.eventData ??
    {};

  const result =
    await sql`
      UPDATE posted_events
      SET
        status = 'posted',
        facebook_post_id = COALESCE(
          facebook_post_id,
          ${null}
        ),
        posted_at = COALESCE(
          posted_at,
          NOW()
        ),
        claim_expires_at = NULL,
        updated_at = NOW()
      WHERE event_key = ${event.eventKey}
        AND status = 'claimed'
      RETURNING event_key
    `;

  return result.length > 0;
}
