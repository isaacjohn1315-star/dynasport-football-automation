const GRAPH_API_VERSION = "v24.0";

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const PAGE_ACCESS_TOKEN =
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

export async function postToFacebook(
  message: string
): Promise<{
  success: boolean;
  postId?: string;
  error?: string;
}> {
  if (!PAGE_ID) {
    throw new Error(
      "FACEBOOK_PAGE_ID is not configured"
    );
  }

  if (!PAGE_ACCESS_TOKEN) {
    throw new Error(
      "FACEBOOK_PAGE_ACCESS_TOKEN is not configured"
    );
  }

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}` +
    `/${PAGE_ID}/feed`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      access_token: PAGE_ACCESS_TOKEN,
    }),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    return {
      success: false,
      error:
        data?.error?.message ||
        `Facebook API request failed: ${response.status}`,
    };
  }

  return {
    success: true,
    postId: data.id,
  };
}
