import { NextRequest, NextResponse } from "next/server";
import { postToFacebook } from "@/lib/facebook";

export async function GET(
  request: NextRequest
) {
  try {
    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "CRON_SECRET is not configured",
        },
        { status: 500 }
      );
    }

    const providedKey =
      request.nextUrl.searchParams.get("key");

    if (providedKey !== cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const message =
      `⚽ DYNA SPORT TEST POST

` +
      `✅ Facebook automation is connected successfully.

` +
      `This is a test post from the DynaSport football automation system.

` +
      `DynaSport ⚽`;

    const result =
      await postToFacebook(message);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Test post published successfully to Facebook.",
      postId: result.postId ?? null,
      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
