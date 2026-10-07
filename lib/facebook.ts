const GRAPH_API_VERSION = "v24.0";

const PAGE_ID =
  process.env.FACEBOOK_PAGE_ID;

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
    return {
      success: false,
      error:
        "FACEBOOK_PAGE_ID is not configured",
    };
  }

  if (!PAGE_ACCESS_TOKEN) {
    return {
      success: false,
      error:
        "FACEBOOK_PAGE_ACCESS_TOKEN is not configured",
    };
  }

  if (!message.trim()) {
    return {
      success: false,
      error: "Facebook message is empty",
    };
  }

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}` +
    `/${PAGE_ID}/feed`;

  try {
    const response = await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          message,
          access_token:
            PAGE_ACCESS_TOKEN,
        }),

        cache: "no-store",
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      data?.error
    ) {
      return {
        success: false,

        error:
          data?.error?.message ||
          `Facebook API request failed: ${response.status}`,
      };
    }

    return {
      success: true,
      postId: data?.id,
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unknown Facebook error",
    };
  }
}
