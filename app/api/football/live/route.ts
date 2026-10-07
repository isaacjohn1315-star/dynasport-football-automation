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

  return Array.isArray(response)
    ? (response as FootballFixture[])
    : [];
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

  try {
    /*
     * This is intentionally a single
     * API-Football request.
     *
     * Do not add another fixture,
     * event, lineup, statistics, or
     * fixture-detail request here.
     *
     * The free API quota is limited.
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
        (fixture) => {
          const leagueId =
            fixture.league?.id;

          return (
            typeof leagueId === "number" &&
            COMPETITION_IDS.has(
              leagueId
            )
          );
        }
      );

    const matches =
      trackedFixtures.map(
        (fixture) => ({
          fixtureId:
            fixture.fixture?.id ??
            null,

          date:
            fixture.fixture?.date ??
            null,

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

          competition:
            fixture.league?.name ??
            null,

          country:
            fixture.league?.country ??
            null,

          season:
            fixture.league?.season ??
            null,

          home:
            fixture.teams?.home?.name ??
            null,

          away:
            fixture.teams?.away?.name ??
            null,

          homeScore:
            fixture.goals?.home ??
            null,

          awayScore:
            fixture.goals?.away ??
            null,

          eventCount:
            Array.isArray(
              fixture.events
            )
              ? fixture.events.length
              : 0,
        })
      );

    return NextResponse.json({
      success: true,

      apiRequest:
        "fixtures?live=all",

      fixturesReturned:
        fixtures.length,

      trackedFixtures:
        trackedFixtures.length,

      matches,

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
            : "Unknown live fixture error",

        timestamp:
          new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
            }
