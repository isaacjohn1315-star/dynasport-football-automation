const BASE_URL =
  process.env.FOOTBALL_API_BASE_URL ||
  "https://v3.football.api-sports.io";

const API_KEY = process.env.FOOTBALL_API_KEY;

export async function footballApiRequest(
  endpoint: string,
  params: Record<string, string | number> = {}
) {
  if (!API_KEY) {
    throw new Error("FOOTBALL_API_KEY is not configured");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-apisports-key": API_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Football API request failed: ${response.status}`
    );
  }

  return response.json();
}
