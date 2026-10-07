import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  footballApiRequest,
  getLiveFixtures,
} from "@/lib/football-api";

import {
  createCompetition,
  isTrackedCompetition,
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

  return (
    authorization ===
    `Bearer ${expectedSecret}`
  );
}

function normalizeFixtures(
  data: unknown
): FootballFixture[] {
  return getLiveFixtures<FootballFixture>(
    data
  );
}

export async function GET(
  request: NextRequest
) {
  if (!isAuthorized(request)) {
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
     * This is intentionally ONE API request.
     *
     * It retrieves live fixtures from ALL competitions
     * covered by API-Football.
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

    /*
     * Only discard malformed fixtures that do not
     * contain a valid competition ID.
     *
     * We do NOT maintain a competition whitelist.
     */
    const trackedFixtures =
      fixtures.filter(
        (fixture) =>
          isTrackedCompetition(
            fixture.league?.id
          )
      );

    const matches =
      trackedFixtures.map(
        (fixture) => {
          const competition =
            createCompetition(
              fixture.league
            );

          return {
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

            competitionId:
              fixture.league?.id ??
              null,

            competition:
              competition?.name ??
              fixture.league?.name ??
              null,

            country:
              competition?.country ??
              fixture.league?.country ??
              null,

            season:
              fixture.league?.season ??
              null,

            priority:
              competition?.priority ??
              "other",

            home:
              fixture.teams?.home?.name ??
              null,

            away:
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

            eventCount:
              Array.isArray(
                fixture.events
              )
                ? fixture.events.length
                : 0,

            hasLineups:
              Array.isArray(
                fixture.lineups
              )
                ? fixture.lineups.length >
                  0
                : false,

            hasStatistics:
              Array.isArray(
                fixture.statistics
              )
                ? fixture.statistics.length >
                  0
                : false,

            hasPlayers:
              Array.isArray(
                fixture.players
              )
                ? fixture.players.length >
                  0
                : false,
          };
        }
      );

    return NextResponse.json({
      success: true,

      apiRequest:
        "fixtures?live=all",

      competitionMode:
        "all_api_football_competitions",

      fixturesReturned:
        fixtures.length,

      validFixtures:
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
