const BASE_URL =
  process.env.FOOTBALL_API_BASE_URL ||
  "https://v3.football.api-sports.io";

const API_KEY =
  process.env.FOOTBALL_API_KEY;

export type FootballApiResponse<
  T = unknown
> = {
  get?: string;

  parameters?: Record<
    string,
    unknown
  >;

  errors?:
    | Record<
        string,
        unknown
      >
    | unknown[];

  results?: number;

  paging?: {
    current?: number;
    total?: number;
  };

  response?: T;
};

function getApiErrorMessage(
  errors: unknown
): string | null {
  if (!errors) {
    return null;
  }

  if (
    Array.isArray(errors)
  ) {
    if (errors.length === 0) {
      return null;
    }

    return errors
      .map((error) => {
        if (
          typeof error ===
          "string"
        ) {
          return error;
        }

        if (
          error &&
          typeof error ===
            "object"
        ) {
          try {
            return JSON.stringify(
              error
            );
          } catch {
            return String(
              error
            );
          }
        }

        return String(error);
      })
      .join("; ");
  }

  if (
    typeof errors ===
    "object"
  ) {
    const entries =
      Object.entries(
        errors as Record<
          string,
          unknown
        >
      );

    if (
      entries.length === 0
    ) {
      return null;
    }

    return entries
      .map(
        ([key, value]) =>
          `${key}: ${String(
            value
          )}`
      )
      .join("; ");
  }

  return String(errors);
}

export async function footballApiRequest<
  T = unknown
>(
  endpoint: string,
  params: Record<
    string,
    string | number
  > = {}
): Promise<
  FootballApiResponse<T>
> {
  if (!API_KEY) {
    throw new Error(
      "FOOTBALL_API_KEY is not configured"
    );
  }

  const url =
    new URL(
      `${BASE_URL}${endpoint}`
    );

  for (
    const [key, value] of Object.entries(
      params
    )
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      continue;
    }

    url.searchParams.set(
      key,
      String(value)
    );
  }

  let response: Response;

  try {
    response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            "x-apisports-key":
              API_KEY,

            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Football API network error: ${error.message}`
        : "Football API network error"
    );
  }

  let data:
    | FootballApiResponse<T>
    | null =
    null;

  try {
    data =
      (await response.json()) as FootballApiResponse<T>;
  } catch {
    throw new Error(
      `Football API returned invalid JSON: ${response.status}`
    );
  }

  if (!response.ok) {
    const apiError =
      getApiErrorMessage(
        data?.errors
      );

    throw new Error(
      apiError
        ? `Football API request failed (${response.status}): ${apiError}`
        : `Football API request failed: ${response.status}`
    );
  }

  const logicalError =
    getApiErrorMessage(
      data?.errors
    );

  if (logicalError) {
    throw new Error(
      `Football API error: ${logicalError}`
    );
  }

  return data;
}

/*
 * Safely extracts API-Football's response array.
 */
export function getApiResponseArray<
  T = unknown
>(
  data: unknown
): T[] {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return [];
  }

  const response =
    (
      data as {
        response?: unknown;
      }
    ).response;

  if (
    !Array.isArray(response)
  ) {
    return [];
  }

  return response as T[];
}

/*
 * Returns API-Football's result count.
 */
export function getApiResultCount(
  data: unknown
): number {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return 0;
  }

  const results =
    (
      data as {
        results?: unknown;
      }
    ).results;

  if (
    typeof results ===
    "number"
  ) {
    return results;
  }

  return getApiResponseArray(
    data
  ).length;
}

/*
 * Returns paging information safely.
 */
export function getApiPaging(
  data: unknown
): {
  current: number | null;
  total: number | null;
} {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return {
      current: null,
      total: null,
    };
  }

  const paging =
    (
      data as {
        paging?: {
          current?: unknown;
          total?: unknown;
        };
      }
    ).paging;

  return {
    current:
      typeof paging
        ?.current ===
      "number"
        ? paging.current
        : null,

    total:
      typeof paging
        ?.total ===
      "number"
        ? paging.total
        : null,
  };
}

/*
 * Normalizes the common live-fixture response.
 *
 * This deliberately does not filter competitions.
 *
 * Every competition supplied by API-Football
 * is returned to the caller.
 */
export function getLiveFixtures<
  T = unknown
>(
  data: unknown
): T[] {
  return getApiResponseArray<T>(
    data
  );
}

/*
 * Convenience helper for determining whether
 * an API-Football fixture contains a usable
 * competition.
 */
export function hasCompetition(
  fixture: unknown
): boolean {
  if (
    !fixture ||
    typeof fixture !==
      "object"
  ) {
    return false;
  }

  const league =
    (
      fixture as {
        league?: {
          id?: unknown;
          name?: unknown;
        };
      }
    ).league;

  return (
    typeof league?.id ===
      "number" &&
    Number.isFinite(
      league.id
    ) &&
    league.id > 0
  );
    }
