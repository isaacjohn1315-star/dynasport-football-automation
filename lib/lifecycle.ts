import {
  FootballEvent,
  FootballFixture,
  createEventKey,
  getEventType,
  getMatchStatus,
} from "@/lib/events";

export type LifecycleEvent = {
  eventKey: string;

  fixtureId: number;

  eventType: string;

  eventMinute:
    | number
    | null;

  teamName:
    | string
    | null;

  playerName:
    | string
    | null;

  eventData: Record<
    string,
    unknown
  >;
}

function createStatusEvent(
  fixture: FootballFixture,
  statusKey: string,
  eventType: string,
  minute:
    | number
    | null = null
): LifecycleEvent | null {
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !==
    "number"
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
        fixture.fixture
          ?.status?.short ??
        null,

      statusLong:
        fixture.fixture
          ?.status?.long ??
        null,

      elapsed:
        fixture.fixture
          ?.status?.elapsed ??
        null,

      extra:
        fixture.fixture
          ?.status?.extra ??
        null,

      fixtureDate:
        fixture.fixture?.date ??
        null,

      venue:
        fixture.fixture?.venue ??
        null,

      referee:
        fixture.fixture?.referee ??
        null,

      competitionId:
        fixture.league?.id ??
        null,

      competition:
        fixture.league?.name ??
        null,

      country:
        fixture.league?.country ??
        null,

      season:
        fixture.league?.season ??
        null,

      round:
        fixture.league?.round ??
        null,

      homeTeam:
        fixture.teams?.home?.name ??
        null,

      awayTeam:
        fixture.teams?.away?.name ??
        null,

      homeTeamId:
        fixture.teams?.home?.id ??
        null,

      awayTeamId:
        fixture.teams?.away?.id ??
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
    typeof fixtureId !==
    "number"
  ) {
    return null;
  }

  return {
    eventKey:
      createEventKey(
        fixtureId,
        event
      ),

    fixtureId,

    eventType:
      getEventType(event),

    eventMinute:
      event.time
        ?.elapsed ??
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
        event.time
          ?.elapsed ??
        null,

      extraMinute:
        event.time
          ?.extra ??
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
  minute:
    | number
    | null
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
    typeof fixtureId !==
    "number"
  ) {
    return [];
  }

  const status =
    getMatchStatus(
      fixture
    );

  const lifecycle: LifecycleEvent[] =
    [];

  /*
   * ----------------------------------------------------------
   * MATCH START
   * ----------------------------------------------------------
   *
   * If the first poll sees HT/2H/FT/etc., we can still
   * reconstruct the earlier lifecycle markers.
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
   * FULL TIME
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
      fixture.fixture
        ?.status?.elapsed ??
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
      fixture.fixture
        ?.status?.elapsed ??
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
      fixture.fixture
        ?.status?.elapsed ??
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
      fixture.fixture
        ?.status?.elapsed ??
        null
    );
  }

  /*
   * AWARDED
   */
  if (
    status === "AWD"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "awarded",
      "match_awarded",
      null
    );
  }

  /*
   * WALKOVER
   */
  if (
    status === "WO"
  ) {
    addStatusEvent(
      lifecycle,
      fixture,
      "walkover",
      "match_walkover",
      null
    );
  }

  /*
   * ----------------------------------------------------------
   * INDIVIDUAL API-FOOTBALL EVENTS
   * ----------------------------------------------------------
   *
   * Every event is processed independently.
   *
   * Therefore:
   *
   * Goal
   * Yellow card
   * Substitution
   * Corner
   *
   * can all be detected during the same 15-minute poll.
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
   * ----------------------------------------------------------
   * DEDUPLICATION
   * ----------------------------------------------------------
   *
   * The event key is generated before this stage.
   *
   * Multiple copies of the same event in an API response
   * therefore collapse into one event.
   */
  const uniqueEvents =
    new Map<
      string,
      LifecycleEvent
    >();

  for (
    const event of lifecycle
  ) {
    if (
      !uniqueEvents.has(
        event.eventKey
      )
    ) {
      uniqueEvents.set(
        event.eventKey,
        event
      );
    }
  }

  /*
   * Sort chronologically where possible.
   *
   * This is particularly important when one Cron run discovers
   * several events that happened since the previous check.
   */
  return Array.from(
    uniqueEvents.values()
  ).sort(
    (a, b) => {
      const minuteA =
        a.eventMinute ??
        9999;

      const minuteB =
        b.eventMinute ??
        9999;

      if (
        minuteA !==
        minuteB
      ) {
        return (
          minuteA -
          minuteB
        );
      }

      return a.eventKey.localeCompare(
        b.eventKey
      );
    }
  );
      }
