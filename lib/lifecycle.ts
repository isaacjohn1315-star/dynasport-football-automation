import {
  FootballFixture,
  FootballEvent,
  createEventKey,
} from "@/lib/events";

function text(value: unknown): string {
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

function fixtureTeams(
  fixture: FootballFixture
) {
  return {
    homeTeam:
      fixture.teams?.home?.name ?? null,
    awayTeam:
      fixture.teams?.away?.name ?? null,
    homeTeamId:
      fixture.teams?.home?.id ?? null,
    awayTeamId:
      fixture.teams?.away?.id ?? null,
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

  const events: FootballEvent[] = [];

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
    fixtureTeams(fixture);

  /*
   * Every API-Football event is processed individually.
   * We deliberately do not collapse multiple events occurring
   * during the same minute.
   */
  if (
    Array.isArray(fixture.events)
  ) {
    fixture.events.forEach(
      (rawEvent, index) => {
        const type =
          text(rawEvent.type)
            .toLowerCase();

        const detail =
          text(rawEvent.detail);

        const minute =
          numberOrNull(
            rawEvent.time?.elapsed
          );

        const eventExtra =
          numberOrNull(
            rawEvent.time?.extra
          );

        const eventType =
          `${type || "event"}_${(
            detail || "update"
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "_"
            )
            .replace(
              /^_|_$/g,
              ""
            )}`;

        events.push(
          makeEvent(
            fixtureId,
            eventType,
            index,
            minute,
            {
              ...teams,

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
   * Important match-status lifecycle events.
   * The database event key prevents these from being posted twice.
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

          status,
          statusLong,
          elapsed,
          extra,

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
        }
      )
    );
  }

  /*
   * Starting XI / lineup availability.
   * This is emitted when API-Football provides lineups.
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
   * Score-state snapshots provide a fallback for important
   * score changes even when an individual event is unavailable.
   */
  const homeScore =
    numberOrNull(
      fixture.goals?.home
    );

  const awayScore =
    numberOrNull(
      fixture.goals?.away
    );

  if (
    homeScore !== null ||
    awayScore !== null
  ) {
    events.push(
      makeEvent(
        fixtureId,
        "score_update",
        elapsed ?? 0,
        elapsed,
        {
          ...teams,
          minute: elapsed,

          homeScore,
          awayScore,

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
        }
      )
    );
  }

  return events;
          }
