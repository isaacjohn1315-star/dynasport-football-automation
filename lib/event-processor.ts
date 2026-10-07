import { getDb } from "@/lib/db";
import {
  buildLifecycleEvents,
  LifecycleEvent,
} from "@/lib/lifecycle";

import { FootballFixture } from "@/lib/events";

export async function getNewEvents(
  fixture: FootballFixture
): Promise<LifecycleEvent[]> {
  const sql = getDb();

  const lifecycleEvents = buildLifecycleEvents(fixture);

  if (lifecycleEvents.length === 0) {
    return [];
  }

  const newEvents: LifecycleEvent[] = [];

  for (const event of lifecycleEvents) {
    const existing = await sql`
      SELECT id
      FROM posted_events
      WHERE event_key = ${event.eventKey}
      LIMIT 1
    `;

    if (existing.length === 0) {
      newEvents.push(event);
    }
  }

  return newEvents;
}

export async function saveEvent(
  event: LifecycleEvent
): Promise<boolean> {
  const sql = getDb();

  const result = await sql`
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
      ${JSON.stringify(event.eventData)}
    )
    ON CONFLICT (event_key) DO NOTHING
    RETURNING id
  `;

  return result.length > 0;
}

export async function processFixture(
  fixture: FootballFixture
): Promise<LifecycleEvent[]> {
  const newEvents = await getNewEvents(fixture);

  const savedEvents: LifecycleEvent[] = [];

  for (const event of newEvents) {
    const saved = await saveEvent(event);

    if (saved) {
      savedEvents.push(event);
    }
  }

  return savedEvents;
}
