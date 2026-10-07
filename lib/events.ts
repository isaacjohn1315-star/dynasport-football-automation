export type FootballEvent = {
  time?: {
    elapsed?: number | null;
    extra?: number | null;
  };

  team?: {
    id?: number | null;
    name?: string | null;
  };

  player?: {
    id?: number | null;
    name?: string | null;
  };

  assist?: {
    id?: number | null;
    name?: string | null;
  };

  type?: string | null;
  detail?: string | null;
  comments?: string | null;
};

export type FootballFixture = {
  fixture?: {
    id?: number;
    date?: string;

    status?: {
      short?: string | null;
      long?: string | null;
      elapsed?: number | null;
      extra?: number | null;
    };
  };

  league?: {
    id?: number;
    name?: string | null;
    country?: string | null;
  };

  teams?: {
    home?: {
      id?: number;
      name?: string | null;
    };

    away?: {
      id?: number;
      name?: string | null;
    };
  };

  goals?: {
    home?: number | null;
    away?: number | null;
  };

  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };

    fulltime?: {
      home?: number | null;
      away?: number | null;
    };

    extratime?: {
      home?: number | null;
      away?: number | null;
    };

    penalty?: {
      home?: number | null;
      away?: number | null;
    };
  };

  events?: FootballEvent[];

  statistics?: unknown[];
};

export function createEventKey(
  fixtureId: number,
  event: FootballEvent
): string {
  const minute = event.time?.elapsed ?? 0;
  const extra = event.time?.extra ?? 0;
  const teamId = event.team?.id ?? 0;
  const playerId = event.player?.id ?? 0;
  const assistId = event.assist?.id ?? 0;
  const type = event.type ?? "unknown";
  const detail = event.detail ?? "unknown";

  return [
    fixtureId,
    minute,
    extra,
    teamId,
    playerId,
    assistId,
    type,
    detail,
  ].join(":");
}

export function getEventType(event: FootballEvent): string {
  const type = event.type?.toLowerCase() ?? "";
  const detail = event.detail?.toLowerCase() ?? "";

  if (type === "goal") {
    if (detail.includes("missed")) {
      return "missed_penalty";
    }

    if (detail.includes("own goal")) {
      return "own_goal";
    }

    if (detail.includes("penalty")) {
      return "penalty_goal";
    }

    return "goal";
  }

  if (type === "card") {
    if (detail.includes("yellow-red")) {
      return "second_yellow_red";
    }

    if (detail.includes("second yellow")) {
      return "second_yellow_red";
    }

    if (detail.includes("yellow")) {
      return "yellow_card";
    }

    if (detail.includes("red")) {
      return "red_card";
    }

    return "card";
  }

  if (type === "subst") {
    return "substitution";
  }

  if (type === "var") {
    return "var";
  }

  if (
    type.includes("corner") ||
    detail.includes("corner")
  ) {
    return "corner";
  }

  return type || "unknown";
}

export function getEventMinute(
  event: FootballEvent
): number | null {
  return event.time?.elapsed ?? null;
}

export function getEventExtraMinute(
  event: FootballEvent
): number | null {
  return event.time?.extra ?? null;
}

export function getEventTeam(
  event: FootballEvent
): string | null {
  return event.team?.name ?? null;
}

export function getEventPlayer(
  event: FootballEvent
): string | null {
  return event.player?.name ?? null;
}

export function getEventAssist(
  event: FootballEvent
): string | null {
  return event.assist?.name ?? null;
}

export function getMatchStatus(
  fixture: FootballFixture
): string {
  return fixture.fixture?.status?.short ?? "UNKNOWN";
}

export function isMatchStarted(
  fixture: FootballFixture
): boolean {
  const status = getMatchStatus(fixture);

  return [
    "1H",
    "HT",
    "2H",
    "ET",
    "BT",
    "P",
    "FT",
    "AET",
    "PEN",
  ].includes(status);
}

export function isHalfTime(
  fixture: FootballFixture
): boolean {
  return getMatchStatus(fixture) === "HT";
}

export function isSecondHalf(
  fixture: FootballFixture
): boolean {
  return [
    "2H",
    "ET",
    "BT",
    "P",
  ].includes(getMatchStatus(fixture));
}

export function isExtraTime(
  fixture: FootballFixture
): boolean {
  return [
    "ET",
    "BT",
    "P",
    "AET",
    "PEN",
  ].includes(getMatchStatus(fixture));
}

export function isFullTime(
  fixture: FootballFixture
): boolean {
  return [
    "FT",
    "AET",
    "PEN",
  ].includes(getMatchStatus(fixture));
}

export function getStatusLabel(
  fixture: FootballFixture
): string {
  const status = getMatchStatus(fixture);

  switch (status) {
    case "NS":
      return "Not Started";

    case "1H":
      return "First Half";

    case "HT":
      return "Half-Time";

    case "2H":
      return "Second Half";

    case "ET":
      return "Extra Time";

    case "BT":
      return "Extra-Time Break";

    case "P":
      return "Penalties";

    case "FT":
      return "Full-Time";

    case "AET":
      return "After Extra Time";

    case "PEN":
      return "After Penalties";

    case "PST":
      return "Postponed";

    case "CANC":
      return "Cancelled";

    case "ABD":
      return "Abandoned";

    case "SUSP":
      return "Suspended";

    case "INT":
      return "Interrupted";

    case "AWD":
      return "Awarded";

    case "WO":
      return "Walkover";

    default:
      return status || "Unknown";
  }
  }
