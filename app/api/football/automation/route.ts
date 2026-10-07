import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  footballApiRequest,
} from "@/lib/football-api";

import {
  COMPETITION_IDS,
} from "@/lib/competitions";

import {
  FootballFixture,
} from "@/lib/events";

import {
  getNewEvents,
  markEventAsPosted,
} from "@/lib/event-processor";

import {
  postToFacebook,
} from "@/lib/facebook";

import {
  buildFacebookMessage,
} from "@/lib/messages";

function isAuthorized(
  request: NextRequest
): boolean {
  const expectedSecret =
    process.env.CRON_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (!authorization) {
    return false;
  }

  return (
    authorization ===
    `Bearer ${expectedSecret}`
  );
}

function normalizeFixtures(
  data: unknown
): FootballFixture[] {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return [];
  }

  if (
    !("response" in data)
  ) {
    return [];
  }

  const response =
    (data as {
      response?: unknown;
    }).response;

  if (
    !Array.isArray(response)
  ) {
    return [];
  }

  return response as FootballFixture[];
}

function isTrackedCompetition(
  fixture: FootballFixture
): boolean {
  const leagueId =
    fixture.league?.id;

  if (
    typeof leagueId !== "number"
  ) {
    return false;
  }

  return COMPETITION_IDS.has(
    leagueId
  );
}

function addCompetitionData(
  fixture: FootballFixture,
  event: Awaited<
    ReturnType<typeof getNewEvents>
  >[number]
) {
  const competition =
    fixture.league?.name;

  if (
    competition
  ) {
    event.eventData.competition =
      competition;
  }

  const country =
    fixture.league?.country;

  if (
    country
  ) {
    event.eventData.country =
      country;
  }

  const season =
    fixture.league?.season;

  if (
    typeof season === "number"
  ) {
    event.eventData.season =
      season;
  }

  event.eventData.homeTeam =
    fixture.teams?.home?.name ??
    null;

  event.eventData.awayTeam =
    fixture.teams?.away?.name ??
    null;

  event.eventData.homeScore =
    fixture.goals?.home ??
    null;

  event.eventData.awayScore =
    fixture.goals?.away ??
    null;
}

export async function GET(
  request: NextRequest
) {
  const startedAt =
    Date.now();

  if (
    !isAuthorized(request)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    /*
     * IMPORTANT:
     *
     * This is deliberately the only
     * Football API request made by
     * the normal automation run.
     *
     * With a 15-minute external cron:
     *
     * 4 requests/hour
     * × 24 hours
     * = 96 requests/day
     *
     * That keeps us inside the
     * API-Football free limit of
     * 100 requests/day.
     */
    const data =
      await footballApiRequest(
        "/fixtures",
        {
          live: "all",
        }
      );

    const fixtures =
      normalizeFixtures(data);

    const trackedFixtures =
      fixtures.filter(
        isTrackedCompetition
      );

    let fixturesChecked = 0;
    let eventsDetected = 0;
    let eventsPosted = 0;
    let eventsAlreadyPosted = 0;
    let facebookFailures = 0;

    const results: Array<{
      fixtureId: number;
      home: string;
      away: string;
      competition: string;
      status: string;
      newEvents: number;
      postedEvents: number;
    }> = [];

    for (
      const fixture of trackedFixtures
    ) {
      const fixtureId =
        fixture.fixture?.id;

      if (
        typeof fixtureId !== "number"
      ) {
        continue;
      }

      fixturesChecked++;

      const home =
        fixture.teams?.home?.name ??
        "Home";

      const away =
        fixture.teams?.away?.name ??
        "Away";

      const competition =
        fixture.league?.name ??
        "Unknown competition";

      const status =
        fixture.fixture?.status?.short ??
        "UNKNOWN";

      const newEvents =
        await getNewEvents(
          fixture
        );

      eventsDetected +=
        newEvents.length;

      let postedForFixture = 0;

      /*
       * Every event is processed
       * individually.
       *
       * We deliberately do NOT collapse
       * multiple events into one post.
       *
       * Example:
       *
       * 67' Goal
       * 68' Yellow card
       * 69' Substitution
       *
       * becomes three separately
       * tracked events and three
       * separate Facebook posts.
       */
      for (
        const event of newEvents
      ) {
        addCompetitionData(
          fixture,
          event
        );

        const message =
          buildFacebookMessage(
            event
          );

        const facebookResult =
          await postToFacebook(
            message
          );

        if (
          facebookResult.success
        ) {
          const saved =
            await markEventAsPosted(
              event
            );

          if (saved) {
            eventsPosted++;
            postedForFixture++;
          } else {
            /*
             * This means another
             * automation invocation
             * already claimed the
             * same event.
             */
            eventsAlreadyPosted++;
          }
        } else {
          /*
           * Important:
           *
           * We do NOT mark the event
           * as posted when Facebook
           * fails.
           *
           * The next cron run can
           * therefore retry it.
           */
          facebookFailures++;
        }
      }

      results.push({
        fixtureId,
        home,
        away,
        competition,
        status,
        newEvents:
          newEvents.length,
        postedEvents:
          postedForFixture,
      });
    }

    const duration =
      Date.now() -
      startedAt;

    return NextResponse.json({
      success: true,

      service:
        "DynaSport Football Automation",

      message:
        "Automation run completed",

      apiRequest:
        "fixtures?live=all",

      fixturesReturned:
        fixtures.length,

      trackedFixtures:
        trackedFixtures.length,

      fixturesChecked,

      eventsDetected,

      eventsPosted,

      eventsAlreadyPosted,

      facebookFailures,

      durationMs:
        duration,

      timestamp:
        new Date().toISOString(),

      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown automation error",

        timestamp:
          new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
    }
