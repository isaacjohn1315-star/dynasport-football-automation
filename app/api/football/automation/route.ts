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
    typeof data !== "object" ||
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

  return (
    typeof leagueId === "number" &&
    COMPETITION_IDS.has(
      leagueId
    )
  );
}

function enrichEvent(
  fixture: FootballFixture,
  event: Awaited<
    ReturnType<typeof getNewEvents>
  >[number]
) {
  event.eventData.competition =
    fixture.league?.name ??
    null;

  event.eventData.country =
    fixture.league?.country ??
    null;

  event.eventData.season =
    fixture.league?.season ??
    null;

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

  event.eventData.fixtureDate =
    fixture.fixture?.date ??
    null;

  event.eventData.matchStatus =
    fixture.fixture?.status?.short ??
    null;

  event.eventData.matchStatusLong =
    fixture.fixture?.status?.long ??
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
     * ONE API-FOOTBALL REQUEST ONLY.
     *
     * At a 15-minute Cron interval:
     *
     * 4 requests/hour × 24 hours
     * = 96 requests/day.
     *
     * This preserves the free-plan
     * quota buffer.
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
    let eventsAlreadyHandled = 0;
    let facebookFailures = 0;

    const results: Array<{
      fixtureId: number;
      competition: string;
      home: string;
      away: string;
      status: string;
      score: string;
      newEvents: number;
      postedEvents: number;
      failedEvents: number;
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

      const homeScore =
        fixture.goals?.home ??
        0;

      const awayScore =
        fixture.goals?.away ??
        0;

      const newEvents =
        await getNewEvents(
          fixture
        );

      eventsDetected +=
        newEvents.length;

      let postedForFixture = 0;
      let failedForFixture = 0;

      /*
       * Every event remains independent.
       *
       * We do not combine:
       *
       * Goal + card + substitution
       *
       * into one Facebook post.
       */
      for (
        const event of newEvents
      ) {
        enrichEvent(
          fixture,
          event
        );

        const message =
          buildFacebookMessage(
            event
          );

        /*
         * Facebook receives the exact
         * human-style message generated
         * for this individual event.
         */
        const facebookResult =
          await postToFacebook(
            message
          );

        if (
          !facebookResult.success
        ) {
          facebookFailures++;
          failedForFixture++;

          /*
           * Do NOT mark failed events
           * as posted.
           *
           * The next Cron run can retry.
           */
          continue;
        }

        /*
         * Only after Facebook accepts
         * the post do we record the
         * event as successfully handled.
         */
        const saved =
          await markEventAsPosted(
            event
          );

        if (saved) {
          eventsPosted++;
          postedForFixture++;
        } else {
          /*
           * Another invocation may have
           * already recorded this exact
           * event.
           */
          eventsAlreadyHandled++;
        }
      }

      results.push({
        fixtureId,

        competition,

        home,

        away,

        status,

        score:
          `${homeScore}-${awayScore}`,

        newEvents:
          newEvents.length,

        postedEvents:
          postedForFixture,

        failedEvents:
          failedForFixture,
      });
    }

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

      eventsAlreadyHandled,

      facebookFailures,

      durationMs:
        Date.now() -
        startedAt,

      results,

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown automation error",

        durationMs:
          Date.now() -
          startedAt,

        timestamp:
          new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
        }
