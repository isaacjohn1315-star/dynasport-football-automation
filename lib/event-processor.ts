import { getDb } from "@/lib/db";

import {
  buildLifecycleEvents,
  LifecycleEvent,
} from "@/lib/lifecycle";

import {
  FootballFixture,
} from "@/lib/events";

/*
 * Find events that have not yet been
 * successfully recorded as posted.
 *
 * We intentionally check every lifecycle
 * event individually.
 */
export async function getNewEvents(
  fixture: FootballFixture
): Promise<LifecycleEvent[]> {
  const sql = getDb();

  const lifecycleEvents =
    buildLifecycleEvents(
      fixture
    );

  if (
    lifecycleEvents.length === 0
  ) {
    return [];
  }

  const newEvents: LifecycleEvent[] =
    [];

  for (
    const event of lifecycleEvents
  ) {
    const existing =
      await sql`
        SELECT id
        FROM posted_events
        WHERE event_key =
          ${event.eventKey}
        LIMIT 1
      `;

    if (
      existing.length === 0
    ) {
      newEvents.push(event);
    }
  }

  return newEvents;
}

/*
 * Atomically claim an event after
 * Facebook has successfully accepted it.
 *
 * ON CONFLICT prevents duplicate database
 * records if two Cron invocations happen
 * to process the same event at the same time.
 */
export async function markEventAsPosted(
  event: LifecycleEvent
): Promise<boolean> {
  const sql = getDb();

  const result =
    await sql`
      INSERT INTO posted_events (
        event_key,
        fixture_id,
        event_type,
        event_minute,
        team_name,
        player_name,
        event_data
      )
      VALUES (
        ${event.eventKey},
        ${event.fixtureId},
        ${event.eventType},
        ${event.eventMinute},
        ${event.teamName},
        ${event.playerName},
        ${JSON.stringify(
          event.eventData
        )}
      )

      ON CONFLICT (
        event_key
      )

      DO NOTHING

      RETURNING id;
    `;

  return result.length > 0;
}

/*
 * Save multiple successfully published
 * events.
 *
 * Each event remains independent.
 *
 * If one event fails to insert because
 * another Cron run already recorded it,
 * the other events can still be processed.
 */
export async function markEventsAsPosted(
  events: LifecycleEvent[]
): Promise<LifecycleEvent[]> {
  const posted: LifecycleEvent[] =
    [];

  for (
    const event of events
  ) {
    const saved =
      await markEventAsPosted(
        event
      );

    if (saved) {
      posted.push(event);
    }
  }

  return posted;
}

/*
 * Useful for diagnostics and future
 * administration.
 */
export async function getPostedEventCount(
  fixtureId?: number
): Promise<number> {
  const sql = getDb();

  if (
    typeof fixtureId ===
    "number"
  ) {
    const result =
      await sql`
        SELECT COUNT(*)::int AS count
        FROM posted_events
        WHERE fixture_id =
          ${fixtureId};
      `;

    return (
      Number(
        result[0]?.count
      ) || 0
    );
  }

  const result =
    await sql`
      SELECT COUNT(*)::int AS count
      FROM posted_events;
    `;

  return (
    Number(
      result[0]?.count
    ) || 0
  );
}

/*
 * Retrieve recent posted events.
 *
 * This is kept here rather than making
 * another API-Football request.
 */
export async function getRecentPostedEvents(
  limit = 50
) {
  const sql = getDb();

  const safeLimit =
    Math.min(
      Math.max(
        Math.floor(limit),
        1
      ),
      200
    );

  return sql`
    SELECT
      id,
      event_key,
      fixture_id,
      event_type,
      event_minute,
      team_name,
      player_name,
      event_data,
      posted_at
    FROM posted_events
    ORDER BY posted_at DESC
    LIMIT ${safeLimit};
  `;
    }
