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
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !== "number"
  ) {
    return null;
  }

  return {
    eventKey:
      `${fixtureId}:status:${statusKey}`,

    fixtureId,

    eventType,

    eventMinute:
      minute,

    teamName:
      null,

    playerName:
      null,

    eventData: {
      status:
        fixture.fixture?.status
          ?.short ??
        null,

      statusLong:
        fixture.fixture?.status
          ?.long ??
        null,

      elapsed:
        fixture.fixture?.status
          ?.elapsed ??
        null,

      extra:
        fixture.fixture?.status
          ?.extra ??
        null,

      homeTeam:
        fixture.teams?.home?.name ??
        null,

      awayTeam:
        fixture.teams?.away?.name ??
        null,

      homeScore:
        fixture.goals?.home ??
        null,

      awayScore:
        fixture.goals?.away ??
        null,

      halftimeHome:
        fixture.score?.halftime
          ?.home ??
        null,

      halftimeAway:
        fixture.score?.halftime
          ?.away ??
        null,

      fulltimeHome:
        fixture.score?.fulltime
          ?.home ??
        null,

      fulltimeAway:
        fixture.score?.fulltime
          ?.away ??
        null,

      extraTimeHome:
        fixture.score?.extratime
          ?.home ??
        null,

      extraTimeAway:
        fixture.score?.extratime
          ?.away ??
        null,

      penaltyHome:
        fixture.score?.penalty
          ?.home ??
        null,

      penaltyAway:
        fixture.score?.penalty
          ?.away ??
        null,
    },
  };
}

function createFixtureEvent(
  fixture: FootballFixture,
  event: FootballEvent
): LifecycleEvent | null {
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !== "number"
  ) {
    return null;
  }

  const eventType =
    getEventType(event);

  return {
    eventKey:
      createEventKey(
        fixtureId,
        event
      ),

    fixtureId,

    eventType,

    eventMinute:
      event.time?.elapsed ??
      null,

    teamName:
      event.team?.name ??
      null,

    playerName:
      event.player?.name ??
      null,

    eventData: {
      type:
        event.type ??
        null,

      detail:
        event.detail ??
        null,

      comments:
        event.comments ??
        null,

      minute:
        event.time?.elapsed ??
        null,

      extraMinute:
        event.time?.extra ??
        null,

      team:
        event.team ??
        null,

      player:
        event.player ??
        null,

      assist:
        event.assist ??
        null,
    },
  };
}

function addStatusEvent(
  lifecycle: LifecycleEvent[],
  fixture: FootballFixture,
  statusKey: string,
  eventType: string,
  minute: number | null
) {
  const event =
    createStatusEvent(
      fixture,
      statusKey,
      eventType,
      minute
    );

  if (event) {
    lifecycle.push(event);
  }
}

export function buildLifecycleEvents(
  fixture: FootballFixture
): LifecycleEvent[] {
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !== "number"
  ) {
    return [];
  }

  const status =
    fixture.fixture?.status?.short ??
    "";

  const lifecycle:
    LifecycleEvent[] = [];

  /*
   * MATCH START
   *
   * Once API-Football reports the
   * fixture as having entered play,
   * create the permanent "started"
   * event.
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
    addStatusEvent(
      lifecycle,
      fixture,
      "started",
      "match_started",
      1
    );
  }

  /*
   * FIRST HALF
   *
   * This is separate from the general
   * match-start event.
   */
  if (
    status === "1H"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "first_half",
      "first_half_started",
      1
    );
  }

  /*
   * HALF-TIME
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
    addStatusEvent(
      lifecycle,
      fixture,
      "half_time",
      "half_time",
      45
    );
  }

  /*
   * SECOND HALF
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
    addStatusEvent(
      lifecycle,
      fixture,
      "second_half",
      "second_half_started",
      46
    );
  }

  /*
   * EXTRA TIME
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
    addStatusEvent(
      lifecycle,
      fixture,
      "extra_time",
      "extra_time_started",
      91
    );
  }

  /*
   * EXTRA-TIME BREAK
   */
  if (
    status === "BT"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "extra_time_break",
      "extra_time_break",
      null
    );
  }

  /*
   * PENALTY SHOOTOUT
   */
  if (
    [
      "P",
      "PEN",
    ].includes(status)
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "penalties",
      "penalties_started",
      null
    );
  }

  /*
   * FULL-TIME
   */
  if (
    [
      "FT",
      "AET",
      "PEN",
    ].includes(status)
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "full_time",
      "full_time",
      fixture.fixture?.status
        ?.elapsed ??
        null
    );
  }

  /*
   * POSTPONED
   */
  if (
    status === "PST"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "postponed",
      "match_postponed",
      null
    );
  }

  /*
   * CANCELLED
   */
  if (
    status === "CANC"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "cancelled",
      "match_cancelled",
      null
    );
  }

  /*
   * ABANDONED
   */
  if (
    status === "ABD"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "abandoned",
      "match_abandoned",
      fixture.fixture?.status
        ?.elapsed ??
        null
    );
  }

  /*
   * SUSPENDED
   */
  if (
    status === "SUSP"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "suspended",
      "match_suspended",
      fixture.fixture?.status
        ?.elapsed ??
        null
    );
  }

  /*
   * INTERRUPTED
   */
  if (
    status === "INT"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "interrupted",
      "match_interrupted",
      fixture.fixture?.status
        ?.elapsed ??
        null
    );
  }

  /*
   * ALL INDIVIDUAL FOOTBALL EVENTS
   *
   * Nothing is grouped together here.
   *
   * If the API gives us:
   *
   * 67' Goal
   * 68' Yellow
   * 69' Substitution
   *
   * all three become independent
   * lifecycle events.
   */
  const fixtureEvents =
    Array.isArray(
      fixture.events
    )
      ? fixture.events
      : [];

  for (
    const event of fixtureEvents
  ) {
    const normalized =
      createFixtureEvent(
        fixture,
        event
      );

    if (normalized) {
      lifecycle.push(
        normalized
      );
    }
  }

  /*
   * Remove duplicates inside the
   * current API response.
   */
  const uniqueEvents =
    new Map<
      string,
      LifecycleEvent
    >();

  for (
    const event of lifecycle
  ) {
    uniqueEvents.set(
      event.eventKey,
      event
    );
  }

  return Array.from(
    uniqueEvents.values()
  );
      }
