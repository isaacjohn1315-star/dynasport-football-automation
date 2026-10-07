import { NextRequest, NextResponse } from "next/server";

import { footballApiRequest } from "@/lib/football-api";
import { COMPETITIONS } from "@/lib/competitions";
import { buildLifecycleEvents } from "@/lib/lifecycle";
import { FootballFixture } from "@/lib/events";

export async function GET(
  request: NextRequest
) {
  try {
    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "CRON_SECRET is not configured",
        },
        { status: 500 }
      );
    }

    const providedSecret =
      request.nextUrl.searchParams.get("key");

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const data = await footballApiRequest(
      "/fixtures",
      {
        live: "all",
      }
    );

    const competitionIds =
      new Set<number>(
        COMPETITIONS.map(
          (competition) => competition.id
        )
      );

    const fixtures: FootballFixture[] =
      Array.isArray(data.response)
        ? data.response.filter(
            (fixture: FootballFixture) =>
              competitionIds.has(
                fixture.league?.id ?? 0
              )
          )
        : [];

    const matches = fixtures.map(
      (fixture) => ({
        fixtureId:
          fixture.fixture?.id ?? null,

        competition:
          fixture.league?.name ?? null,

        home:
          fixture.teams?.home?.name ?? null,

        away:
          fixture.teams?.away?.name ?? null,

        status:
          fixture.fixture?.status?.short ?? null,

        elapsed:
          fixture.fixture?.status?.elapsed ??
          null,

        score: {
          home:
            fixture.goals?.home ?? null,

          away:
            fixture.goals?.away ?? null,
        },

        events:
          buildLifecycleEvents(
            fixture
          ).map((event) => ({
            type: event.eventType,
            minute: event.eventMinute,
            team: event.teamName,
            player: event.playerName,
          })),
      })
    );

    return NextResponse.json({
      success: true,
      fixturesChecked: fixtures.length,
      matches,
      facebookPostsCreated: 0,
      databaseChanges: 0,
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
            : "Unknown error",
      },
      { status: 500 }
    );
  }
      }
