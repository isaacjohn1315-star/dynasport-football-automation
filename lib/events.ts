export type FootballEvent = {
  eventKey: string;
  eventType: string;
  eventMinute: number | null;
  eventData: Record<string, unknown>;
};

export type FootballFixture = {
  fixture?: {
    id?: number;
    date?: string;
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
    season?: number | null;
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

  events?: Array<{
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
  }>;

  lineups?: unknown[];
  statistics?: unknown[];
  players?: unknown[];
};

export function createEventKey(
  fixtureId: number,
  eventType: string,
  index: number,
  eventData: Record<string, unknown>
): string {
  const minute =
    typeof eventData.minute === "number"
      ? eventData.minute
      : "na";

  const playerId =
    typeof eventData.playerId === "number"
      ? eventData.playerId
      : "na";

  const teamId =
    typeof eventData.teamId === "number"
      ? eventData.teamId
      : "na";

  return [
    fixtureId,
    eventType,
    minute,
    teamId,
    playerId,
    index,
  ].join(":");
}
