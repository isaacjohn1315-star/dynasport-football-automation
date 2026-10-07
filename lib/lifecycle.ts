import {
  FootballEvent,
  FootballFixture,
  createEventKey,
  getEventType,
} from "@/lib/events";

export type LifecycleEvent = {
  eventKey: string;
  fixtureId: number;
  eventType: string;
  eventMinute: number | null;
  teamName: string | null;
  playerName: string | null;
  eventData: Record<string, unknown>;
};

function createStatusEvent(
  fixture: FootballFixture,
  statusKey: string,
  eventType: string,
  minute: number | null = null
): LifecycleEvent | null {
  const fixtureId = fixture.fixture?.id;

  if (!fixtureId) {
    return null;
  }

  return {
    eventKey: `${fixtureId}:status:${statusKey}`,
    fixtureId,
    eventType,
    eventMinute: minute,
    teamName: null,
    playerName: null,
    eventData: {
      status: fixture.fixture?.status?.short ?? null,
      statusLong: fixture.fixture?.status?.long ?? null,
      homeTeam: fixture.teams?.home?.name ?? null,
      awayTeam: fixture.teams?.away?.name ?? null,
      homeScore: fixture.goals?.home ?? null,
      awayScore: fixture.goals?.away ?? null,
    },
  };
}

function createFixtureEvent(
  fixture: FootballFixture,
  event: FootballEvent
): LifecycleEvent | null {
  const fixtureId = fixture.fixture?.id;

  if (!fixtureId) {
    return null;
  }

  const eventType = getEventType(event);

  return {
    eventKey: createEventKey(fixtureId, event),
    fixtureId,
    eventType,
    eventMinute: event.time?.elapsed ?? null,
    teamName: event.team?.name ?? null,
    playerName: event.player?.name ?? null,
    eventData: {
      type: event.type ?? null,
      detail: event.detail ?? null,
      comments: event.comments ?? null,
      minute: event.time?.elapsed ?? null,
      extraMinute: event.time?.extra ?? null,
      team: event.team ?? null,
      player: event.player ?? null,
      assist: event.assist ?? null,
    },
  };
}

export function buildLifecycleEvents(
  fixture: FootballFixture
): LifecycleEvent[] {
  const fixtureId = fixture.fixture?.id;

  if (!fixtureId) {
    return [];
  }

  const status = fixture.fixture?.status?.short ?? "";

  const lifecycle: LifecycleEvent[] = [];

  /*
   * Match started.
   *
   * Once API-Football reports 1H or any later active/finished
   * status, the match has definitely started.
   */
  if (
    [
      "1H",
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
      "FT",
      "AET",
      "PEN",
    ].includes(status)
  ) {
    const event = createStatusEvent(
      fixture,
      "started",
      "match_started",
      1
    );

    if (event) {
      lifecycle.push(event);
    }
  }

  /*
   * Half-time.
   */
  if (
    [
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
      "FT",
      "AET",
      "PEN",
    ].includes(status)
  ) {
    const event = createStatusEvent(
      fixture,
      "half_time",
      "half_time",
      45
    );

    if (event) {
      lifecycle.push(event);
    }
  }

  /*
   * Second half started.
   */
  if (
    [
      "2H",
      "ET",
      "BT",
      "P",
      "FT",
      "AET",
      "PEN",
    ].includes(status)
  ) {
    const event = createStatusEvent(
      fixture,
      "second_half",
      "second_half_started",
      46
    );

    if (event) {
      lifecycle.push(event);
    }
  }

  /*
   * Extra time.
   */
  if (
    [
      "ET",
      "BT",
      "P",
      "AET",
      "PEN",
    ].includes(status)
  ) {
    const event = createStatusEvent(
      fixture,
      "extra_time",
      "extra_time_started",
      91
    );

    if (event) {
      lifecycle.push(event);
    }
  }

  /*
   * Penalty shootout.
   */
  if (
    [
      "P",
      "PEN",
    ].includes(status)
  ) {
    const event = createStatusEvent(
      fixture,
      "penalties",
      "penalties_started",
      null
    );

    if (event) {
      lifecycle.push(event);
    }
  }

  /*
   * Full-time.
   */
  if (
    [
      "FT",
      "AET",
      "PEN",
    ].includes(status)
  ) {
    const event = createStatusEvent(
      fixture,
      "full_time",
      "full_time",
      fixture.fixture?.status?.elapsed ?? null
    );

    if (event) {
      lifecycle.push(event);
    }
  }

  /*
   * Individual API-Football events:
   *
   * Goals
   * Own goals
   * Missed penalties
   * Yellow cards
   * Red cards
   * Second yellows
   * Substitutions
   * VAR
   * Corners, if supplied by the API response
   * Other event types supplied by API-Football
   */
  const fixtureEvents = Array.isArray(fixture.events)
    ? fixture.events
    : [];

  for (const event of fixtureEvents) {
    const normalized = createFixtureEvent(fixture, event);

    if (normalized) {
      lifecycle.push(normalized);
    }
  }

  return lifecycle;
    }
