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

    referee?: string | null;

    timezone?: string | null;

    venue?: {
      id?: number | null;
      name?: string | null;
      city?: string | null;
    };

    status?: {
      long?: string | null;
      short?: string | null;
      elapsed?: number | null;
      extra?: number | null;
    };
  };

  league?: {
    id?: number;
    name?: string | null;
    country?: string | null;
    logo?: string | null;
    flag?: string | null;
    season?: number | null;
    round?: string | null;
    standings?: boolean | null;
  };

  teams?: {
    home?: {
      id?: number;
      name?: string | null;
      logo?: string | null;
      winner?: boolean | null;
    };

    away?: {
      id?: number;
      name?: string | null;
      logo?: string | null;
      winner?: boolean | null;
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

  lineups?: unknown[];

  statistics?: unknown[];

  players?: unknown[];
};

export function createEventKey(
  fixtureId: number,
  event: FootballEvent
): string {
  const minute =
    event.time?.elapsed ?? 0;

  const extra =
    event.time?.extra ?? 0;

  const teamId =
    event.team?.id ?? 0;

  const playerId =
    event.player?.id ?? 0;

  const assistId =
    event.assist?.id ?? 0;

  const type =
    event.type
      ?.toLowerCase()
      .trim() ??
    "unknown";

  const detail =
    event.detail
      ?.toLowerCase()
      .trim() ??
    "unknown";

  /*
   * Do NOT use comments as part of the primary
   * event identity.
   *
   * API-Football can change comments between
   * requests. Using comments could make the same
   * event look like a brand-new event and cause
   * duplicate Facebook posts.
   */
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

export function getEventType(
  event: FootballEvent
): string {
  const type =
    event.type
      ?.toLowerCase()
      .trim() ??
    "";

  const detail =
    event.detail
      ?.toLowerCase()
      .trim() ??
    "";

  const comments =
    event.comments
      ?.toLowerCase()
      .trim() ??
    "";

  const combined =
    `${type} ${detail} ${comments}`;

  /*
   * GOALS
   */
  if (type === "goal") {
    if (
      detail.includes(
        "missed penalty"
      ) ||
      detail.includes(
        "penalty missed"
      )
    ) {
      return "missed_penalty";
    }

    if (
      detail.includes(
        "own goal"
      ) ||
      detail.includes(
        "own-goal"
      )
    ) {
      return "own_goal";
    }

    if (
      detail.includes(
        "penalty"
      )
    ) {
      return "penalty_goal";
    }

    return "goal";
  }

  /*
   * CARDS
   */
  if (type === "card") {
    if (
      detail.includes(
        "second yellow"
      ) ||
      detail.includes(
        "yellow-red"
      ) ||
      detail.includes(
        "second yellow card"
      )
    ) {
      return "second_yellow_red";
    }

    if (
      detail.includes(
        "red"
      )
    ) {
      return "red_card";
    }

    if (
      detail.includes(
        "yellow"
      )
    ) {
      return "yellow_card";
    }

    return "card";
  }

  /*
   * SUBSTITUTIONS
   */
  if (
    type === "subst" ||
    type === "substitution"
  ) {
    return "substitution";
  }

  /*
   * VAR
   */
  if (
    type === "var" ||
    combined.includes(
      "var"
    ) ||
    combined.includes(
      "video assistant"
    )
  ) {
    return "var";
  }

  /*
   * CORNERS
   */
  if (
    combined.includes(
      "corner"
    )
  ) {
    return "corner";
  }

  /*
   * PENALTIES
   */
  if (
    combined.includes(
      "penalty"
    )
  ) {
    return "penalty";
  }

  /*
   * OFFSIDES
   */
  if (
    combined.includes(
      "offside"
    )
  ) {
    return "offside";
  }

  /*
   * FOULS
   */
  if (
    combined.includes(
      "foul"
    )
  ) {
    return "foul";
  }

  /*
   * SHOTS / ATTACK EVENTS
   */
  if (
    combined.includes(
      "shot"
    )
  ) {
    return "shot";
  }

  /*
   * If API-Football introduces another event
   * type, preserve it rather than throwing it away.
   */
  return (
    type ||
    "unknown"
  );
}

export function getEventMinute(
  event: FootballEvent
): number | null {
  return (
    event.time?.elapsed ??
    null
  );
}

export function getEventExtraMinute(
  event: FootballEvent
): number | null {
  return (
    event.time?.extra ??
    null
  );
}

export function getEventTeam(
  event: FootballEvent
): string | null {
  return (
    event.team?.name ??
    null
  );
}

export function getEventPlayer(
  event: FootballEvent
): string | null {
  return (
    event.player?.name ??
    null
  );
}

export function getEventAssist(
  event: FootballEvent
): string | null {
  return (
    event.assist?.name ??
    null
  );
}

export function getMatchStatus(
  fixture: FootballFixture
): string {
  return (
    fixture.fixture?.status
      ?.short
      ?.toUpperCase() ??
    "UNKNOWN"
  );
}

export function isMatchStarted(
  fixture: FootballFixture
): boolean {
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
    "LIVE",
  ].includes(
    getMatchStatus(
      fixture
    )
  );
}

export function isFirstHalf(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "1H"
  );
}

export function isHalfTime(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "HT"
  );
}

export function isSecondHalf(
  fixture: FootballFixture
): boolean {
  return [
    "2H",
    "ET",
    "BT",
    "P",
    "FT",
    "AET",
    "PEN",
  ].includes(
    getMatchStatus(
      fixture
    )
  );
}

export function isExtraTime(
  fixture: FootballFixture
): boolean {
  return [
    "ET",
    "BT",
    "P",
    "FT",
    "AET",
    "PEN",
  ].includes(
    getMatchStatus(
      fixture
    )
  );
}

export function isExtraTimeBreak(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "BT"
  );
}

export function isPenaltyShootout(
  fixture: FootballFixture
): boolean {
  return [
    "P",
    "PEN",
  ].includes(
    getMatchStatus(
      fixture
    )
  );
}

export function isFullTime(
  fixture: FootballFixture
): boolean {
  return [
    "FT",
    "AET",
    "PEN",
  ].includes(
    getMatchStatus(
      fixture
    )
  );
}

export function isPostponed(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "PST"
  );
}

export function isCancelled(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "CANC"
  );
}

export function isAbandoned(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "ABD"
  );
}

export function isSuspended(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "SUSP"
  );
}

export function isInterrupted(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
      fixture
    ) === "INT"
  );
}

export function isAwarded(
  fixture: FootballFixture
): boolean {
  return (
    getMatchStatus(
