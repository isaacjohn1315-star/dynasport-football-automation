import { NextRequest, NextResponse } from "next/server";

import { footballApiRequest } from "@/lib/football-api";
import { COMPETITIONS } from "@/lib/competitions";
import {
  getNewEvents,
  markEventAsPosted,
} from "@/lib/event-processor";
import { createFacebookMessage } from "@/lib/messages";
import { postToFacebook } from "@/lib/facebook";
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

    const authorization =
      request.headers.get("authorization");

    const providedSecret =
      authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

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

    const competitionIds = new Set<number>(
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

    const results = [];

    for (const fixture of fixtures) {
      const newEvents =
        await getNewEvents(fixture);

      for (const event of newEvents) {
        const message =
          createFacebookMessage(
            fixture,
            event
          );

        const facebookResult =
          await postToFacebook(message);

        if (!facebookResult.success) {
          results.push({
            fixtureId: event.fixtureId,
            eventType: event.eventType,
            success: false,
            error: facebookResult.error,
          });

          continue;
        }

        const saved =
          await markEventAsPosted(event);

        results.push({
          fixtureId: event.fixtureId,
          eventType: event.eventType,
          success: saved,
          postId:
            facebookResult.postId ?? null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      fixturesChecked: fixtures.length,
      eventsProcessed: results.length,
      results,
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
