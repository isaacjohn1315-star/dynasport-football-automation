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
  return getLiveFixtures<FootballFixture>(
    data
  );
}

function enrichEventData(
  fixture: FootballFixture,
  eventData: Record<
    string,
    unknown
  >
): Record<string, unknown> {
  const competition =
    createCompetition(
      fixture.league
    );

  return {
    ...eventData,

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

    competitionPriority:
      competition?.priority ??
      "other",

    season:
      fixture.league?.season ??
      null,

    fixtureDate:
      fixture.fixture?.date ??
      null,

    fixtureStatus:
      fixture.fixture?.status
        ?.short ??
      null,

    fixtureStatusLong:
      fixture.fixture?.status
        ?.long ??
      null,

    fixtureElapsed:
      fixture.fixture?.status
        ?.elapsed ??
      null,

    fixtureExtra:
      fixture.fixture?.status
        ?.extra ??
      null,

    homeTeam:
      fixture.teams?.home?.name ??
      null,

    awayTeam:
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

    extraTimeHome:
      fixture.score?.extratime
        ?.home ??
      null,

    extraTimeAway:
      fixture.score?.extratime
        ?.away ??
      null,

    penaltyHome:
      fixture.score?.penalty
        ?.home ??
      null,

    penaltyAway:
      fixture.score?.penalty
        ?.away ??
      null,
  };
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

  const startedAt =
    new Date();

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

    const trackedFixtures =
      fixtures.filter(
        (fixture) =>
          isTrackedCompetition(
            fixture.league?.id
          )
      );

    let discoveredEvents = 0;
    let newEvents = 0;
    let facebookPosts = 0;
    let facebookFailures = 0;

    const results: Array<
      Record<string, unknown>
    > = [];

    for (
      const fixture of trackedFixtures
    ) {
      const fixtureId =
        fixture.fixture?.id;

      if (
        typeof fixtureId !==
        "number"
      ) {
        continue;
      }

      const competition =
        createCompetition(
          fixture.league
        );

      const lifecycleEvents =
        await getNewEvents(
          fixture
        );

      discoveredEvents +=
        lifecycleEvents.length;

      if (
        lifecycleEvents.length ===
        0
      ) {
        continue;
      }

      newEvents +=
        lifecycleEvents.length;

      for (
        const event of lifecycleEvents
      ) {
        const enrichedEventData =
          enrichEventData(
            fixture,
            event.eventData
          );

        const enrichedEvent = {
          ...event,
          eventData:
            enrichedEventData,
        };

        let message: string;

        try {
          message =
            buildFacebookMessage(
              enrichedEvent
            );
        } catch (error) {
          results.push({
            fixtureId,

            competition:
              competition?.name ??
              fixture.league
                ?.name ??
              null,

            eventKey:
              event.eventKey,

            eventType:
              event.eventType,

            success: false,

            stage:
              "message_generation",

            error:
              error instanceof Error
                ? error.message
                : "Unknown message generation error",
          });

          continue;
        }

        if (
          !message ||
          !message.trim()
        ) {
          results.push({
            fixtureId,

            competition:
              competition?.name ??
              fixture.league
                ?.name ??
              null,

            eventKey:
              event.eventKey,

            eventType:
              event.eventType,

            success: false,

            stage:
              "message_generation",

            error:
              "Generated Facebook message is empty",
          });

          continue;
        }

        const facebookResult =
          await postToFacebook(
            message
          );

        if (
          !facebookResult.success
        ) {
          facebookFailures++;

          results.push({
            fixtureId,

            competition:
              competition?.name ??
              fixture.league
                ?.name ??
              null,

            country:
              competition?.country ??
              fixture.league
                ?.country ??
              null,

            eventKey:
              event.eventKey,

            eventType:
              event.eventType,

            minute:
              event.eventMinute,

            success: false,

            stage:
              "facebook",

            error:
              facebookResult.error ??
              "Facebook post failed",
          });

          continue;
        }

        const marked =
          await markEventAsPosted(
            enrichedEvent,
            facebookResult.postId
          );

        if (!marked) {
          results.push({
            fixtureId,

            competition:
              competition?.name ??
              fixture.league
                ?.name ??
              null,

            country:
              competition?.country ??
              fixture.league
                ?.country ??
              null,

            eventKey:
              event.eventKey,

            eventType:
              event.eventType,

            success: true,

            stage:
              "database_conflict",

            facebookPostId:
              facebookResult.postId ??
              null,

            warning:
              "Facebook post succeeded but event was already recorded",
          });

          continue;
        }

        facebookPosts++;

        results.push({
          fixtureId,

          competition:
            competition?.name ??
            fixture.league
              ?.name ??
            null,

          country:
            competition?.country ??
            fixture.league
              ?.country ??
            null,

          season:
            fixture.league?.season ??
            null,

          eventKey:
            event.eventKey,

          eventType:
            event.eventType,

          minute:
            event.eventMinute,

          success: true,

          stage:
            "completed",

          facebookPostId:
            facebookResult.postId ??
            null,
        });
      }
    }

    const finishedAt =
      new Date();

    return NextResponse.json({
      success: true,

      mode:
        "all_competitions",

      apiRequest:
        "fixtures?live=all",

      fixturesReturned:
        fixtures.length,

      validFixtures:
        trackedFixtures.length,

      discoveredEvents,

      newEvents,

      facebookPosts,

      facebookFailures,

      startedAt:
        startedAt.toISOString(),

      finishedAt:
        finishedAt.toISOString(),

      results,

      timestamp:
        finishedAt.toISOString(),
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
