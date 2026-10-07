const GRAPH_API_VERSION = "v23.0";

type FacebookResult = {
  success: boolean;
  postId?: string;
  error?: string;
};

export async function postToFacebook(
  message: string
): Promise<FacebookResult> {
  const pageId =
    process.env.FACEBOOK_PAGE_ID;

  const accessToken =
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId) {
    return {
      success: false,
      error:
        "FACEBOOK_PAGE_ID is not configured",
    };
  }

  if (!accessToken) {
    return {
      success: false,
      error:
        "FACEBOOK_PAGE_ACCESS_TOKEN is not configured",
    };
  }

  if (!message.trim()) {
    return {
      success: false,
      error:
        "Facebook message is empty",
    };
  }

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed`;

  try {
    const response =
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          new URLSearchParams({
            message,
            access_token:
              accessToken,
          }).toString(),
        cache: "no-store",
      });

    let data:
      | Record<string, unknown>
      | null = null;

    try {
      data =
        (await response.json()) as Record<
          string,
          unknown
        >;
    } catch {
      return {
        success: false,
        error:
          `Facebook returned invalid JSON (${response.status})`,
      };
    }

    if (!response.ok) {
      const error =
        data?.error;

      if (
        error &&
        typeof error === "object"
      ) {
        const errorObject =
          error as Record<
            string,
            unknown
          >;

        const message =
          typeof errorObject.message ===
          "string"
            ? errorObject.message
            : "Facebook API request failed";

        return {
          success: false,
          error:
            `Facebook API error: ${message}`,
        };
      }

      return {
        success: false,
        error:
          `Facebook API request failed (${response.status})`,
      };
    }

    const postId =
      typeof data?.id === "string"
        ? data.id
        : undefined;

    if (!postId) {
      return {
        success: false,
        error:
          "Facebook accepted the request but did not return a post ID",
      };
    }

    return {
      success: true,
      postId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Facebook network error: ${error.message}`
          : "Facebook network error",
    };
  }
}
