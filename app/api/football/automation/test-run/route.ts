import {
  NextResponse,
} from "next/server";

import {
  getNewEvents,
} from "@/lib/event-processor";

import {
  FootballFixture,
} from "@/lib/events";

import {
  buildFacebookMessage,
} from "@/lib/messages";

export async function GET() {
  try {
    const mockFixture: FootballFixture = {
      fixture: {
        id: 888888,
        date: new Date().toISOString(),
        status: {
          short: "2H",
          long: "Second Half",
          elapsed: 67,
          extra: 0,
        },
      },

      league: {
        id: 39,
        name: "Premier League",
        country: "England",
        season: 2026,
      },

      teams: {
        home: {
          id: 1001,
          name: "DynaSport United",
        },

        away: {
          id: 1002,
          name: "DynaSport City",
        },
      },

      goals: {
        home: 2,
        away: 1,
      },

      score: {
        halftime: {
          home: 1,
          away: 1,
        },

        fulltime: {
          home: null,
          away: null,
        },

        extratime: {
          home: null,
          away: null,
        },

        penalty: {
          home: null,
          away: null,
        },
      },

      events: [
        {
          time: {
            elapsed: 67,
            extra: 0,
          },

          team: {
            id: 1001,
            name: "DynaSport United",
          },

          player: {
            id: 5001,
            name: "Alex Morgan",
          },

          assist: {
            id: 5002,
            name: "Daniel James",
          },

          type: "Goal",
          detail: "Normal Goal",
          comments: null,
        },
      ],
    };

    const events =
      await getNewEvents(
        mockFixture
      );

    const messages =
      events.map(
        (event) => ({
          eventKey:
            event.eventKey,

          eventType:
            event.eventType,

          eventMinute:
            event.eventMinute,

          teamName:
            typeof event.eventData
              ?.teamName ===
            "string"
              ? event.eventData
                  .teamName
              : null,

          playerName:
            typeof event.eventData
              ?.playerName ===
            "string"
              ? event.eventData
                  .playerName
              : null,

          message:
            buildFacebookMessage(
              event
            ),
        })
      );

    return NextResponse.json({
      success: true,

      message:
        "Football event/message test completed",

      fixture: {
        id:
          mockFixture.fixture?.id,

        competition:
          mockFixture.league?.name,

        home:
          mockFixture.teams?.home?.name,

        away:
          mockFixture.teams?.away?.name,

        score:
          `${mockFixture.goals?.home ?? 0}-${mockFixture.goals?.away ?? 0}`,

        status:
          mockFixture.fixture?.status?.short,
      },

      eventsDetected:
        events.length,

      messages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown test-run error",
      },
      {
        status: 500,
      }
    );
  }
}
