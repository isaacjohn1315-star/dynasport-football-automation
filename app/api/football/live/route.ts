import { NextResponse } from "next/server";
import { footballApiRequest } from "@/lib/football-api";
import { COMPETITIONS } from "@/lib/competitions";

export async function GET() {
  try {
    // One API request gets all currently live fixtures.
    const data = await footballApiRequest("/fixtures", {
      live: "all",
    });

    const competitionIds = new Set(
      COMPETITIONS.map((competition) => competition.id)
    );

    const matches = Array.isArray(data.response)
      ? data.response
          .filter((match: any) =>
            competitionIds.has(match.league?.id)
          )
          .map((match: any) => ({
            competition: match.league?.name,
            competitionId: match.league?.id,
            country: match.league?.country,
            fixtureId: match.fixture?.id,
            status: match.fixture?.status?.short,
            elapsed: match.fixture?.status?.elapsed,
            home: match.teams?.home?.name,
            away: match.teams?.away?.name,
            homeScore: match.goals?.home,
            awayScore: match.goals?.away,
          }))
      : [];

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
      requestsUsed: 1,
      timestamp: new Date().toISOString(),
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
