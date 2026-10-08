import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  footballApiRequest,
  getLiveFixtures,
} from "@/lib/football-api";

import {
  FootballFixture,
} from "@/lib/events";

import {
  buildFacebookMessage,
} from "@/lib/messages";

import {
  getNewEvents,
  markEventAsPosted,
} from "@/lib/event-processor";

import {
  postToFacebook,
} from "@/lib/facebook";

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
    const data =
      await footballApiRequest(
        "/fixtures",
        {
          live: "all",
        }
      );

    const fixtures =
      normalizeFixtures(data);

    let fixturesProcessed = 0;
    let eventsDetected = 0;
    let eventsPosted = 0;
    let eventsSkipped = 0;
    let errors = 0;

    const fixtureResults: Array<
      Record<string, unknown>
    > = [];

    for (
      const fixture of fixtures
    ) {
      const fixtureId =
        fixture.fixture?.id;

      if (
        typeof fixtureId !==
        "number"
      ) {
        continue;
      }

      fixturesProcessed++;

      try {
        const newEvents =
          await getNewEvents(
            fixture
          );

        eventsDetected +=
          newEvents.length;

        for (
          const event of newEvents
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

          const message =
            buildFacebookMessage(
              event
            );

          if (
            !message ||
            !message.trim()
          ) {
            eventsSkipped++;
            continue;
          }

          const facebookResult =
            await postToFacebook(
              message
            );

          if (
            !facebookResult.success
          ) {
            errors++;

            fixtureResults.push({
              fixtureId,
              eventType:
                event.eventType,
              success: false,
              error:
                facebookResult.error ??
                "Facebook posting failed",
            });

            continue;
          }

          const marked =
            await markEventAsPosted(
              event,
              facebookResult.postId
            );

          if (marked) {
            eventsPosted++;
          } else {
            eventsSkipped++;
          }

          fixtureResults.push({
            fixtureId,
            eventType:
              event.eventType,
            success: marked,
            facebookPostId:
              facebookResult.postId ??
              null,
          });
        }
      } catch (error) {
        errors++;

        fixtureResults.push({
          fixtureId,
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown fixture processing error",
        });
      }
    }

    return NextResponse.json({
      success: errors === 0,
      apiRequest:
        "fixtures?live=all",
      competitionMode:
        "all_api_football_competitions",
      fixturesReturned:
        fixtures.length,
      fixturesProcessed,
      eventsDetected,
      eventsPosted,
      eventsSkipped,
      errors,
      fixtureResults,
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
        timestamp:
          new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
}
