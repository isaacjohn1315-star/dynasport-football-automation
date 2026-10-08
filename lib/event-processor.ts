import {
  FootballEvent,
} from "@/lib/events";

function pickVariant(
  event: FootballEvent,
  variants: string[]
): string {
  if (variants.length === 0) {
    return "";
  }

  let hash = 0;

  for (
    const character of event.eventKey
  ) {
    hash =
      (hash * 31 +
        character.charCodeAt(0)) %
      variants.length;
  }

  return variants[hash];
}

function getMinuteText(
  event: FootballEvent
): string {
  if (
    event.eventMinute === null ||
    event.eventMinute === undefined
  ) {
    return "";
  }

  const extra =
    event.eventData?.extra;

  if (
    typeof extra === "number" &&
    extra > 0
  ) {
    return `${event.eventMinute}+${extra}'`;
  }

  return `${event.eventMinute}'`;
}

function getMatchData(
  event: FootballEvent
) {
  return {
    homeTeam:
      typeof event.eventData?.homeTeam ===
      "string"
        ? event.eventData.homeTeam
        : "Home",

    awayTeam:
      typeof event.eventData?.awayTeam ===
      "string"
        ? event.eventData.awayTeam
        : "Away",

    homeScore:
      typeof event.eventData?.homeScore ===
      "number"
        ? event.eventData.homeScore
        : null,

    awayScore:
      typeof event.eventData?.awayScore ===
      "number"
        ? event.eventData.awayScore
        : null,
  };
}

function getScoreText(
  event: FootballEvent
): string {
  const {
    homeScore,
    awayScore,
  } = getMatchData(event);

  if (
    homeScore === null ||
    awayScore === null
  ) {
    return "";
  }

  return `${homeScore}-${awayScore}`;
}

function getTeamText(
  event: FootballEvent
): string {
  return (
    typeof event.eventData?.teamName ===
    "string"
      ? event.eventData.teamName
      : "the team"
  );
}

function getPlayerText(
  event: FootballEvent
): string {
  return (
    typeof event.eventData?.playerName ===
    "string"
      ? event.eventData.playerName
      : "the player"
  );
}

function getAssistText(
  event: FootballEvent
): string {
  const assistName =
    event.eventData?.assistName;

  if (
    typeof assistName ===
    "string"
  ) {
    return assistName;
  }

  const assist =
    event.eventData?.assist;

  if (
    assist &&
    typeof assist === "object" &&
    "name" in assist &&
    typeof assist.name === "string"
  ) {
    return assist.name;
  }

  return "";
}

function getCompetitionText(
  event: FootballEvent
): string {
  return typeof event.eventData
    ?.competition === "string"
    ? event.eventData.competition
    : "";
}

function getFixtureHeader(
  event: FootballEvent
): string {
  const {
    homeTeam,
    awayTeam,
  } = getMatchData(event);

  const score =
    getScoreText(event);

  if (score) {
    return `⚽ ${homeTeam} ${score} ${awayTeam}`;
  }

  return `⚽ ${homeTeam} vs ${awayTeam}`;
}

function getEventCommentary(
  event: FootballEvent
): string {
  const team =
    getTeamText(event);

  const player =
    getPlayerText(event);

  const minute =
    getMinuteText(event);

  const score =
    getScoreText(event);

  switch (
    event.eventType
  ) {
    case "match_started":
      return pickVariant(event, [
        "And we're underway! The match has officially kicked off.",
        "Kick-off! The action is officially underway.",
        "We're off! The battle for the points has begun.",
        "Here we go! The match has started.",
      ]);

    case "first_half_started":
      return pickVariant(event, [
        "The first half is underway!",
        "We're off in the opening half!",
        "The referee gets us started. First-half action is underway.",
      ]);

    case "half_time":
      return pickVariant(event, [
        `Half-time! The teams head into the break${score ? ` with the score at ${score}` : ""}.`,
        `That's the end of the first half${score ? ` — ${score}` : ""}.`,
        `HT! The opening 45 minutes are complete${score ? `: ${score}` : ""}.`,
        `The referee brings the first half to an end${score ? ` with ${score} on the scoreboard` : ""}.`,
      ]);

    case "second_half_started":
      return pickVariant(event, [
        `Back underway! The second half has started${score ? ` with the score ${score}` : ""}.`,
        "We're back! The second half is officially underway.",
        `Second half begins${score ? ` — ${score}` : ""}.`,
        "The teams are back out and the second half is underway!",
      ]);

    case "extra_time_started":
      return pickVariant(event, [
        "Extra time is underway! The match could not be decided in normal time.",
        "Into extra time! Another 30 minutes could decide this contest.",
        "The referee signals the start of extra time.",
      ]);

    case "extra_time_break":
      return pickVariant(event, [
        "Extra-time break! One final push remains.",
        "Change of ends in extra time. The decisive moments may be ahead.",
        "Extra-time interval. The players prepare for the final 15 minutes.",
      ]);

    case "penalties_started":
      return pickVariant(event, [
        "Penalty shootout! The match will now be decided from the spot.",
        "We're heading to penalties! The pressure is enormous now.",
        "It all comes down to penalties. Every kick could decide the match.",
      ]);

    case "full_time":
      return pickVariant(event, [
        `FULL-TIME! The referee has brought the match to an end${score ? ` — ${score}` : ""}.`,
        `That's FULL-TIME! The final whistle has been blown${score ? ` with ${score} on the scoreboard` : ""}.`,
        `The final whistle goes! Full-time${score ? `: ${score}` : ""}.`,
        `FULL-TIME! The contest is over${score ? ` and the final score is ${score}` : ""}.`,
      ]);

    case "match_postponed":
      return pickVariant(event, [
        "MATCH POSTPONED! This fixture will not go ahead as originally scheduled.",
        "The match has been postponed. A new date will be confirmed when available.",
        "POSTPONED! The scheduled fixture has been called off for now.",
      ]);

    case "match_cancelled":
      return pickVariant(event, [
        "MATCH CANCELLED! This fixture will not be played as scheduled.",
        "The fixture has been cancelled.",
        "CANCELLED! The scheduled match has been called off.",
      ]);

    case "match_abandoned":
      return pickVariant(event, [
        "MATCH ABANDONED! Play has been brought to an early end.",
        "The referee has abandoned the match before normal full-time.",
        "ABANDONED! The contest has been stopped prematurely.",
      ]);

    case "match_suspended":
      return pickVariant(event, [
        "MATCH SUSPENDED! Play has been temporarily halted.",
        "The match has been suspended. Further information is awaited.",
        "SUSPENDED! The referee has stopped the contest for now.",
      ]);

    case "match_interrupted":
      return pickVariant(event, [
        "MATCH INTERRUPTED! Play has been stopped temporarily.",
        "The match is currently interrupted.",
        "Play has been interrupted. We await the next update.",
      ]);

    case "goal": {
      const assist =
        getAssistText(event);

      if (assist) {
        return pickVariant(event, [
          `GOAL! ${player} finds the net for ${team}, with ${assist} providing the assist!${score ? ` The score is now ${score}.` : ""}`,
          `⚽ GOAL! ${player} finishes for ${team} after a pass from ${assist}.${score ? ` ${score}.` : ""}`,
          `${team} strike! ${player} scores and ${assist} gets the assist.${score ? ` ${score}.` : ""}`,
        ]);
      }

      return pickVariant(event, [
        `GOAL! ${player} finds the net for ${team}!${score ? ` The score is now ${score}.` : ""}`,
        `⚽ GOAL! ${team} have scored! ${player} is the name on the scoresheet.${score ? ` ${score}.` : ""}`,
        `It's in! ${player} has put ${team} on the scoresheet.${score ? ` ${score}.` : ""}`,
        `${team} strike! ${player} finishes the move.${score ? ` ${score}.` : ""}`,
      ]);
    }

    case "penalty_goal":
      return pickVariant(event, [
        `PENALTY GOAL! ${player} keeps their cool from the spot for ${team}.${score ? ` ${score}.` : ""}`,
        `⚽ From the penalty spot — ${player} scores for ${team}!${score ? ` The score is ${score}.` : ""}`,
        `Penalty converted! ${player} makes no mistake for ${team}.${score ? ` ${score}.` : ""}`,
      ]);

    case "own_goal":
      return pickVariant(event, [
        `OWN GOAL! A cruel moment sees the ball end up in the wrong net.${score ? ` ${score}.` : ""}`,
        `Oh no! An own goal changes the score.${score ? ` ${score}.` : ""}`,
        `OWN GOAL! ${team} benefit from a huge slice of fortune.${score ? ` ${score}.` : ""}`,
      ]);

    case "missed_penalty":
      return pickVariant(event, [
        `PENALTY MISSED! ${player} cannot convert from the spot for ${team}.`,
        `What a chance! ${player} misses from the penalty spot.`,
        `Penalty drama! ${player} fails to find the net from the spot.`,
      ]);

    case "yellow_card":
      return pickVariant(event, [
        `🟨 Yellow card for ${player} of ${team}.${minute ? ` ${minute}` : ""}`,
        `BOOKED! ${player} goes into the referee's notebook for ${team}.`,
        `Yellow card shown to ${player}. ${team} will need to be careful from here.`,
      ]);

    case "second_yellow_red":
      return pickVariant(event, [
        `🟥 SECOND YELLOW! ${player} is sent off after receiving another booking.`,
        `RED CARD! A second yellow means ${player} must leave the field.`,
        `Dismissal! ${player} sees red after a second yellow card.`,
      ]);

    case "red_card":
      return pickVariant(event, [
        `🟥 RED CARD! ${player} has been sent off for ${team}.`,
        `SENT OFF! ${player} receives a straight red card.`,
        `Dismissal! ${team} are down to ten men after ${player}'s red card.`,
      ]);

    case "substitution":
      return pickVariant(event, [
        `🔄 SUBSTITUTION: ${player} is introduced by ${team}.`,
        `Change made by ${team}. ${player} comes into the action.`,
        `Fresh legs! ${team} make a substitution, bringing ${player} on.`,
      ]);

    case "var":
      return pickVariant(event, [
        "📺 VAR CHECK: The officials are reviewing a key moment.",
        "VAR drama! The referee is checking the incident with the video officials.",
        "📺 Video review underway. Everyone is waiting for the referee's decision.",
      ]);

    case "corner":
      return pickVariant(event, [
        `Corner kick awarded to ${team}.${minute ? ` ${minute}` : ""}`,
        `${team} win a corner. Another attacking opportunity.`,
        `Set-piece opportunity for ${team} as they are awarded a corner.`,
      ]);

    case "penalty":
      return pickVariant(event, [
        `PENALTY! ${team} are awarded a spot kick.`,
        `Penalty awarded! ${team} have a huge opportunity from 12 yards.`,
        `Spot-kick drama! The referee points to the penalty spot for ${team}.`,
      ]);

    case "foul":
      return pickVariant(event, [
        `Foul given against ${team}${player ? ` involving ${player}` : ""}.`,
        `The referee stops play for a foul involving ${team}.`,
        `Free-kick awarded after a foul by ${team}.`,
      ]);

    case "offside":
      return pickVariant(event, [
        `Offside flag raised against ${team}${player ? ` — ${player}` : ""}.`,
        "The attack is stopped for offside.",
        `Offside! ${team}'s attacking move comes to an end.`,
      ]);

    case "card":
      return pickVariant(event, [
        `Card shown to ${player} of ${team}.`,
        `The referee reaches for a card against ${team}.`,
        `Disciplinary action: ${player} is shown a card.`,
      ]);

    default:
      return pickVariant(event, [
        `${event.eventType.replace(/_/g, " ")} recorded in the match.`,
        `Match update: ${event.eventType.replace(/_/g, " ")}.`,
        "Another important moment has been recorded in the match.",
      ]);
  }
}

export function buildFacebookMessage(
  event: FootballEvent
): string {
  const header =
    getFixtureHeader(event);

  const commentary =
    getEventCommentary(event);

  const minute =
    getMinuteText(event);

  const competition =
    getCompetitionText(event);

  const status =
    typeof event.eventData?.status ===
    "string"
      ? event.eventData.status
      : "";

  const footerParts: string[] =
    [];

  if (competition) {
    footerParts.push(
      `🏆 ${competition}`
    );
  }

  if (
    status === "PEN" ||
    event.eventType ===
      "penalties_started"
  ) {
    footerParts.push(
      "🎯 Penalty shootout"
    );
  }

  const timeLine =
    minute &&
    ![
      "match_started",
      "first_half_started",
      "half_time",
      "second_half_started",
      "extra_time_started",
      "extra_time_break",
      "penalties_started",
      "full_time",
      "match_postponed",
      "match_cancelled",
      "match_abandoned",
      "match_suspended",
      "match_interrupted",
    ].includes(
      event.eventType
    )
      ? `⏱️ ${minute}`
      : "";

  return [
    header,
    "",
    commentary,
    timeLine,
    "",
    ...footerParts,
    "",
    "#DynaSport",
    "#Football",
    "#LiveFootball",
  ]
    .filter(
      (part) =>
        part !== undefined &&
        part !== null &&
        part !== ""
    )
    .join("\n");
}
