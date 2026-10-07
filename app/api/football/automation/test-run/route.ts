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
} from "@/lib/event-processor";

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
}

export async function GET(
  request: NextRequest
) {
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

  const startedAt =
    Date.now();

  try {
    /*
     * REAL API REQUEST
     *
     * This endpoint deliberately
     * performs the same API-Football
     * request as production.
     *
     * It does NOT post to Facebook.
     * It does NOT mark events as posted.
     *
     * Therefore it is safe for
     * inspecting what production
     * would attempt to publish.
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

    const fixtureResults: Array<{
      fixtureId: number;
      competition: string;
      home: string;
      away: string;
      status: string;
      score: string;
      newEvents: Array<{
        eventKey: string;
        eventType: string;
        minute: number | null;
        team: string | null;
        player: string | null;
        message: string;
      }>;
    }> = [];

    let totalNewEvents = 0;

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

      const events =
        await getNewEvents(
          fixture
        );

      for (
        const event of events
      ) {
        enrichEvent(
          fixture,
          event
        );
      }

      totalNewEvents +=
        events.length;

      fixtureResults.push({
        fixtureId,

        competition:
          fixture.league?.name ??
          "Unknown",

        home:
          fixture.teams?.home?.name ??
          "Home",

        away:
          fixture.teams?.away?.name ??
          "Away",

        status:
          fixture.fixture?.status
            ?.short ??
          "UNKNOWN",

        score:
          `${fixture.goals?.home ?? 0}-${fixture.goals?.away ?? 0}`,

        newEvents:
          events.map(
            (event) => ({
              eventKey:
                event.eventKey,

              eventType:
                event.eventType,

              minute:
                event.eventMinute,

              team:
                event.teamName,

              player:
                event.playerName,

              message:
                buildFacebookMessage(
                  event
                ),
            })
          ),
      });
    }

    return NextResponse.json({
      success: true,

      mode:
        "DRY_RUN",

      facebookPosting:
        false,

      databaseWrites:
        false,

      apiRequest:
        "fixtures?live=all",

      fixturesReturned:
        fixtures.length,

      trackedFixtures:
        trackedFixtures.length,

      totalNewEvents,

      fixtureResults,

      durationMs:
        Date.now() -
        startedAt,

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        mode:
          "DRY_RUN",

        error:
          error instanceof Error
            ? error.message
            : "Unknown dry-run error",

        timestamp:
          new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
        }
