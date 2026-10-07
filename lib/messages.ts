import {
  LifecycleEvent,
} from "@/lib/lifecycle";

function pickVariant(
  event: LifecycleEvent,
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
  event: LifecycleEvent
): string {
  if (
    event.eventMinute === null ||
    event.eventMinute === undefined
  ) {
    return "";
  }

  const extra =
    event.eventData?.extraMinute;

  if (
    typeof extra === "number" &&
    extra > 0
  ) {
    return `${event.eventMinute}+${extra}'`;
  }

  return `${event.eventMinute}'`;
}

function getMatchData(
  event: LifecycleEvent
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
  event: LifecycleEvent
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
  event: LifecycleEvent
): string {
  return (
    event.teamName ||
    "the team"
  );
}

function getPlayerText(
  event: LifecycleEvent
): string {
  return (
    event.playerName ||
    "the player"
  );
}

function getAssistText(
  event: LifecycleEvent
): string {
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

function getFixtureHeader(
  event: LifecycleEvent
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
  event: LifecycleEvent
): string {
  const team =
    getTeamText(event);

  const player =
    getPlayerText(event);

  const minute =
    getMinuteText(event);

  const score =
    getScoreText(event);

  const assist =
    getAssistText(event);

  switch (
    event.eventType
  ) {
    case "match_started":
      return pickVariant(event, [
        "And we're underway! The match has officially kicked off.",
        "Kick-off! The action is officially underway.",
        "We're off! The two sides are now battling for the points.",
        "Here we go! The match has started.",
      ]);

    case "half_time":
      return pickVariant(event, [
        `Half-time! The teams head into the break with the score at ${score || "level"}.`,
        `That's the end of the first half. Half-time arrives with ${score || "the score still undecided"}.`,
        `HT! The opening 45 minutes are complete${score ? ` — ${score}` : ""}.`,
        `The referee brings the first half to an end. Half-time${score ? `: ${score}` : ""}.`,
      ]);

    case "second_half_started":
      return pickVariant(event, [
        `Back underway! The second half has started${score ? ` with the score ${score}` : ""}.`,
        "We're back! The second half is officially underway.",
        `Second half begins. Can either side find the breakthrough${score ? `? Current score: ${score}` : "?"}`,
        "The teams are back out and the second half is underway!",
      ]);

    case "extra_time_started":
      return pickVariant(event, [
        "Extra time is underway! The match could not be decided in normal time.",
        "Into extra time! Another 30 minutes will decide this contest if necessary.",
        "The referee signals the start of extra time.",
      ]);

    case "extra_time_break":
      return pickVariant(event, [
        "Extra-time break! The teams prepare for the final 15 minutes.",
        "Change of ends in extra time. One final push remains.",
        "Extra-time interval. The decisive moments may be just ahead.",
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
        `FULL-TIME! Ninety minutes${score ? ` and the final score is ${score}` : ""} are complete.`,
      ]);

    case "goal":
      return pickVariant(event, [
        `GOAL! ${player} finds the net for ${team}!${minute ? ` ${minute}` : ""}${score ? ` The score is now ${score}.` : ""}`,
        `⚽ GOAL! ${team} have scored! ${player} is the name on the scoresheet.${score ? ` ${score}.` : ""}`,
        `It's in! ${player} has put ${team} on the scoresheet.${minute ? ` ${minute}` : ""}${score ? ` ${score}.` : ""}`,
        `${team} strike! ${player} finishes the move and changes the score.${score ? ` ${score}.` : ""}`,
      ]);

    case "penalty_goal":
      return pickVariant(event, [
        `PENALTY GOAL! ${player} keeps their cool from the spot for ${team}.${score ? ` ${score}.` : ""}`,
        `⚽ From the penalty spot — ${player} scores for ${team}!${score ? ` The score is ${score}.` : ""}`,
        `Penalty converted! ${player} makes no mistake for ${team}.${score ? ` ${score}.` : ""}`,
      ]);

    case "own_goal":
      return pickVariant(event, [
        `OWN GOAL! A cruel moment sees the ball end up in the wrong net.${score ? ` ${score}.` : ""}`,
        `Oh no! An own goal changes the score in this match.${score ? ` ${score}.` : ""}`,
        `OWN GOAL! ${team} benefit from a huge slice of fortune.${score ? ` ${score}.` : ""}`,
      ]);

    case "missed_penalty":
      return pickVariant(event, [
        `PENALTY MISSED! ${player} cannot convert from the spot for ${team}.`,
        `What a chance! The penalty is missed by ${player}.`,
        `Penalty drama! ${player} fails to find the net from the spot.`,
      ]);

    case "assist":
      return pickVariant(event, [
        `ASSIST! ${player} provides the final pass in a decisive attacking move.`,
        `Great contribution from ${player}, who supplies the assist.`,
        `The assist goes to ${player} after a quality piece of attacking play.`,
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
        `🔄 SUBSTITUTION: ${player} comes on for ${team}.`,
        `Change made by ${team}. ${player} is introduced.`,
        `Fresh legs! ${team} make a substitution, bringing ${player} into the action.`,
      ]);

    case "var":
      return pickVariant(event, [
        `📺 VAR CHECK: The officials are reviewing a key moment.`,
        `VAR drama! The referee is checking the incident with the video officials.`,
        `📺 Video review underway. Everyone is waiting for the referee's decision.`,
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
        `The attack is stopped for offside.`,
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
        `${event.eventType.replace(
          /_/g,
          " "
        )} recorded in the match.`,
        `Match update: ${event.eventType.replace(
          /_/g,
          " "
        )}.`,
        `Another important moment has been recorded in the match.`,
      ]);
  }
}

export function buildFacebookMessage(
  event: LifecycleEvent
): string {
  const header =
    getFixtureHeader(event);

  const commentary =
    getEventCommentary(event);

  const minute =
    getMinuteText(event);

  const competition =
    typeof event.eventData?.competition ===
    "string"
      ? event.eventData.competition
      : "";

  const footer =
    competition
      ? `\n\n🏆 ${competition}`
      : "";

  const timeLine =
    minute &&
    ![
      "match_started",
      "half_time",
      "second_half_started",
      "extra_time_started",
      "extra_time_break",
      "penalties_started",
      "full_time",
    ].includes(
      event.eventType
    )
      ? `\n⏱️ ${minute}`
      : "";

  return [
    header,
    "",
    commentary,
    timeLine,
    footer,
    "",
    "#DynaSport",
    "#Football",
    "#LiveFootball",
  ]
    .filter(
      (part) =>
        part !== undefined &&
        part !== null
    )
    .join("\n");
}
