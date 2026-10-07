export type CompetitionPriority =
  | "high"
  | "major"
  | "international"
  | "other";

export type Competition = {
  id: number;
  name: string;
  country: string;
  priority: CompetitionPriority;
};

/*
 * DynaSport is intended to cover ALL football competitions
 * returned by API-Football's live fixture feed.
 *
 * We therefore do NOT maintain a hard-coded list of 1,247
 * competition IDs.
 *
 * API-Football returns the following information directly on
 * every fixture:
 *
 *   fixture.league.id
 *   fixture.league.name
 *   fixture.league.country
 *   fixture.league.season
 *
 * This allows DynaSport to automatically recognize:
 *
 * - domestic leagues
 * - domestic cups
 * - super cups
 * - continental competitions
 * - World Cup
 * - World Cup qualifiers
 * - AFCON
 * - AFCON qualifiers
 * - Asian Cup
 * - Asian Cup qualifiers
 * - Euro Championship
 * - Euro qualifiers
 * - Gold Cup
 * - Gold Cup qualifiers
 * - Copa America
 * - UEFA competitions
 * - CAF competitions
 * - women's competitions
 * - youth competitions
 * - playoff competitions
 * - lower divisions
 * - other competitions covered by API-Football
 *
 * API-Football currently lists 1,247 leagues and cups.
 *
 * We deliberately do not guess IDs for competitions.
 */

export const COMPETITIONS: Competition[] = [];

/*
 * Kept for compatibility with existing imports.
 *
 * The old implementation used:
 *
 *   COMPETITION_IDS.has(leagueId)
 *
 * That would require maintaining a massive and constantly
 * changing hard-coded ID list.
 *
 * Instead, every valid API-Football competition is accepted.
 */
export const COMPETITION_IDS =
  new Set<number>();

/*
 * Returns true when a fixture has a valid competition ID.
 *
 * We intentionally accept every API-Football competition.
 */
export function isTrackedCompetition(
  leagueId:
    | number
    | null
    | undefined
): boolean {
  return (
    typeof leagueId ===
      "number" &&
    Number.isFinite(
      leagueId
    ) &&
    leagueId > 0
  );
}

/*
 * Determines a useful priority for Facebook
 * message formatting and future filtering.
 *
 * This does NOT exclude any competition.
 */
export function getCompetitionPriority(
  competition:
    | Pick<
        Competition,
        "name" | "country"
      >
    | null
    | undefined
): CompetitionPriority {
  const name =
    competition?.name
      ?.toLowerCase()
      .trim() ?? "";

  const country =
    competition?.country
      ?.toLowerCase()
      .trim() ?? "";

  /*
   * Nigeria receives highest priority because
   * DynaSport is Nigeria-focused.
   */
  if (
    country === "nigeria" ||
    name.includes("npfl") ||
    name.includes(
      "federation cup"
    )
  ) {
    return "high";
  }

  /*
   * Major global competitions.
   */
  const internationalKeywords = [
    "world cup",
    "africa cup of nations",
    "african nations championship",
    "asian cup",
    "euro championship",
    "copa america",
    "gold cup",
    "champions league",
    "europa league",
    "conference league",
    "nations league",
    "olympics",
    "caf champions league",
    "caf confederation cup",
  ];

  if (
    internationalKeywords.some(
      (keyword) =>
        name.includes(keyword)
    )
  ) {
    return "international";
  }

  /*
   * Major European and global domestic
   * competitions.
   */
  const majorKeywords = [
    "premier league",
    "la liga",
    "serie a",
    "bundesliga",
    "ligue 1",
    "primeira liga",
    "eredivisie",
    "championship",
    "league cup",
    "fa cup",
    "copa del rey",
    "coppa italia",
    "dfb-pokal",
    "coupe de france",
    "mls",
    "liga mx",
    "brasileirao",
    "argentine",
    "pro league",
  ];

  if (
    majorKeywords.some(
      (keyword) =>
        name.includes(keyword)
    )
  ) {
    return "major";
  }

  return "other";
}

/*
 * Converts the API-Football league object into
 * our internal competition structure.
 */
export function createCompetition(
  league:
    | {
        id?: number;
        name?: string | null;
        country?: string | null;
      }
    | null
    | undefined
): Competition | null {
  if (
    typeof league?.id !==
    "number"
  ) {
    return null;
  }

  const name =
    league.name?.trim() ||
    "Unknown Competition";

  const country =
    league.country?.trim() ||
    "Unknown";

  return {
    id: league.id,
    name,
    country,
    priority:
      getCompetitionPriority({
        name,
        country,
      }),
  };
}
