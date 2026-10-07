import {
  FootballFixture,
} from "@/lib/events";

import {
  LifecycleEvent,
} from "@/lib/lifecycle";

function getScore(
  fixture: FootballFixture
): string {
  const home =
    fixture.goals?.home ?? 0;

  const away =
    fixture.goals?.away ?? 0;

  return `${home} - ${away}`;
}

function getTeams(
  fixture: FootballFixture
): string {
  const home =
    fixture.teams?.home?.name ?? "Home";

  const away =
    fixture.teams?.away?.name ?? "Away";

  return `${home} vs ${away}`;
}

function getMinute(
  event: LifecycleEvent
): string {
  if (event.eventMinute === null) {
    return "";
  }

  return ` ${event.eventMinute}'`;
}

export function createFacebookMessage(
  fixture: FootballFixture,
  event: LifecycleEvent
): string {
  const teams = getTeams(fixture);
  const score = getScore(fixture);
  const minute = getMinute(event);

  switch (event.eventType) {
    case "match_started":
      return `⚽ MATCH STARTED

${teams}

Score: ${score}

DynaSport`;

    case "goal":
      return `⚽ GOAL!${minute}

${event.teamName ?? "Goal"} score!

${teams}

Score: ${score}

🔥 DynaSport`;

    case "own_goal":
      return `⚽ OWN GOAL!${minute}

${event.playerName ?? "Player"} has scored an own goal.

${teams}

Score: ${score}

DynaSport`;

    case "penalty_goal":
      return `⚽ PENALTY GOAL!${minute}

${event.playerName ?? "Player"} converts from the spot.

${teams}

Score: ${score}

DynaSport`;

    case "missed_penalty":
      return `❌ MISSED PENALTY!${minute}

${event.playerName ?? "Player"} misses from the spot.

${teams}

Score: ${score}

DynaSport`;

    case "yellow_card":
      return `🟨 YELLOW CARD${minute}

${event.playerName ?? "Player"} booked for ${event.teamName ?? "the team"}.

${teams}

Score: ${score}

DynaSport`;

    case "red_card":
      return `🟥 RED CARD${minute}

${event.playerName ?? "Player"} has been sent off.

${teams}

Score: ${score}

DynaSport`;

    case "second_yellow_red":
      return `🟥 SECOND YELLOW / RED${minute}

${event.playerName ?? "Player"} is sent off.

${teams}

Score: ${score}

DynaSport`;

    case "substitution":
      return `🔄 SUBSTITUTION${minute}

${event.teamName ?? "Team"} make a change.

${event.playerName ?? "Player"}

${teams}

Score: ${score}

DynaSport`;

    case "corner":
      return `🚩 CORNER${minute}

${event.teamName ?? "Team"} win a corner.

${teams}

Score: ${score}

DynaSport`;

    case "var":
      return `📺 VAR${minute}

VAR intervention in:

${teams}

Score: ${score}

DynaSport`;

    case "half_time":
      return `⏸️ HALF-TIME

${teams}

Score: ${score}

Second half coming up.

DynaSport`;

    case "second_half_started":
      return `▶️ SECOND HALF STARTED

${teams}

Score: ${score}

DynaSport`;

    case "extra_time_started":
      return `⏱️ EXTRA TIME

${teams}

Score: ${score}

Extra time has started.

DynaSport`;

    case "penalties_started":
      return `🎯 PENALTY SHOOTOUT

${teams}

The match goes to penalties.

DynaSport`;

    case "full_time":
      return `🔚 FULL-TIME

${teams}

Final Score: ${score}

DynaSport`;

    default:
      return `📢 MATCH UPDATE${minute}

${teams}

Score: ${score}

Event: ${event.eventType}

DynaSport`;
  }
}
