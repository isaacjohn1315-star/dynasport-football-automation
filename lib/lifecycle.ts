import {
  FootballFixture,
  FootballEvent,
  createEventKey,
} from "@/lib/events";

function text(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function numberOrNull(
  value: unknown
): number | null {
  return typeof value === "number"
    ? value
    : null;
}

function makeEvent(
  fixtureId: number,
  eventType: string,
  index: number,
  eventMinute: number | null,
  eventData: Record<string, unknown>
): FootballEvent {
  return {
    eventKey: createEventKey(
      fixtureId,
      eventType,
      index,
      eventData
    ),
    eventType,
    eventMinute,
    eventData,
  };
}

function getTeams(
  fixture: FootballFixture
) {
  return {
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
  };
}

function getScoreData(
  fixture: FootballFixture
) {
  return {
    homeScore:
      fixture.goals?.home ?? null,

    awayScore:
      fixture.goals?.away ?? null,

    halftimeHome:
      fixture.score?.halftime?.home ??
      null,

    halftimeAway:
      fixture.score?.halftime?.away ??
      null,

    fulltimeHome:
      fixture.score?.fulltime?.home ??
      null,

    fulltimeAway:
      fixture.score?.fulltime?.away ??
      null,

    extraTimeHome:
      fixture.score?.extratime?.home ??
      null,

    extraTimeAway:
      fixture.score?.extratime?.away ??
      null,

    penaltyHome:
      fixture.score?.penalty?.home ??
      null,

    penaltyAway:
      fixture.score?.penalty?.away ??
      null,
  };
}

export async function getLifecycleEvents(
  fixture: FootballFixture
): Promise<FootballEvent[]> {
  const fixtureId =
    fixture.fixture?.id;

  if (
    typeof fixtureId !== "number"
  ) {
    return [];
  }

  const events: FootballEvent[] =
    [];

  const status =
    text(
      fixture.fixture?.status?.short
    ).toUpperCase();

  const statusLong =
    text(
      fixture.fixture?.status?.long
    );

  const elapsed =
    numberOrNull(
      fixture.fixture?.status?.elapsed
    );

  const extra =
    numberOrNull(
      fixture.fixture?.status?.extra
    );

  const teams =
    getTeams(fixture);

  const scores =
    getScoreData(fixture);

  /*
   * API-Football individual events.
   *
   * Every event gets its own event key.
   * Therefore two events occurring during the
   * same minute are not collapsed together.
   */
  if (
    Array.isArray(fixture.events)
  ) {
    fixture.events.forEach(
      (rawEvent, index) => {
        const rawType =
          text(rawEvent.type);

        const rawDetail =
          text(rawEvent.detail);

        const minute =
          numberOrNull(
            rawEvent.time?.elapsed
          );

        const eventExtra =
          numberOrNull(
            rawEvent.time?.extra
          );

        const normalizedType =
          rawType
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "_"
            )
            .replace(
              /^_|_$/g,
              ""
            ) ||
          "event";

        const normalizedDetail =
          rawDetail
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "_"
            )
            .replace(
              /^_|_$/g,
              "" 
            );

        const eventType =
          normalizedDetail
            ? `${normalizedType}_${normalizedDetail}`
            : normalizedType;

        events.push(
          makeEvent(
            fixtureId,
            eventType,
            index,
            minute,
            {
              ...teams,
              ...scores,

              minute,
              extra:
                eventExtra,

              type:
                rawEvent.type ??
                null,

              detail:
                rawEvent.detail ??
                null,

              comments:
                rawEvent.comments ??
                null,

              teamId:
                rawEvent.team?.id ??
                null,

              teamName:
                rawEvent.team?.name ??
                null,

              playerId:
                rawEvent.player?.id ??
                null,

              playerName:
                rawEvent.player?.name ??
                null,

              assistId:
                rawEvent.assist?.id ??
                null,

              assistName:
                rawEvent.assist?.name ??
                null,
            }
          )
        );
      }
    );
  }

  /*
   * Match lifecycle statuses supplied by API-Football.
   */
  const lifecycleMap: Record<
    string,
    string
  > = {
    NS: "match_scheduled",
    TBD: "match_time_to_be_determined",
    LIVE: "match_live",
    HT: "half_time",
    ET: "extra_time",
    BT: "extra_time_break",
    P: "penalty_shootout",
    FT: "full_time",
    AET: "after_extra_time",
    PEN: "penalty_shootout_finished",
    PST: "match_postponed",
    CANC: "match_cancelled",
    ABD: "match_abandoned",
    SUSP: "match_suspended",
    INT: "match_interrupted",
    AWD: "match_awarded",
    WO: "match_walkover",
  };

  const lifecycleType =
    lifecycleMap[status];

  if (lifecycleType) {
    events.push(
      makeEvent(
        fixtureId,
        lifecycleType,
        0,
        elapsed,
        {
          ...teams,
          ...scores,

          status,
          statusLong,
          elapsed,
          extra,
        }
      )
    );
  }

  /*
   * Starting lineups.
   *
   * We deliberately create one deterministic event.
   * The database will ensure it is only published once.
   */
  if (
    Array.isArray(
      fixture.lineups
    ) &&
    fixture.lineups.length > 0
  ) {
    events.push(
      makeEvent(
        fixtureId,
        "starting_lineups_available",
        0,
        elapsed,
        {
          ...teams,

          lineupCount:
            fixture.lineups.length,
        }
      )
    );
  }

  /*
   * Score snapshot.
   *
   * This is supplementary protection for score changes
   * that may not arrive as a normal individual event.
   *
   * The event key includes the current minute, so a
   * later score state can be detected without repeatedly
   * publishing the same snapshot during one minute.
   */
  if (
    scores.homeScore !== null ||
    scores.awayScore !== null
  ) {
    const scoreIndex =
      elapsed ?? 0;

    events.push(
      makeEvent(
        fixtureId,
        "score_update",
        scoreIndex,
        elapsed,
        {
          ...teams,
          ...scores,

          minute: elapsed,
        }
      )
    );
  }

  return events;
  }
