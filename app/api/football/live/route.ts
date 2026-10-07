import { NextResponse } from "next/server";
import { footballApiRequest } from "@/lib/football-api";
import { COMPETITIONS } from "@/lib/competitions";

export async function GET() {
  try {
    const results = [];

    for (const competition of COMPETITIONS) {
      const data = await footballApiRequest("/fixtures", {
        live: "all",
        league: competition.id,
      });

      if (Array.isArray(data.response)) {
        results.push(
          ...data.response.map((match: any) => ({
            competition: competition.name,
            competitionId: competition.id,
            fixtureId: match.fixture?.id,
            status: match.fixture?.status?.short,
            elapsed: match.fixture?.status?.elapsed,
            home: match.teams?.home?.name,
            away: match.teams?.away?.name,
            homeScore: match.goals?.home,
            awayScore: match.goals?.away,
          }))
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      matches: results,
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
