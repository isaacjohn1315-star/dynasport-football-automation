import { NextResponse } from "next/server";
import { footballApiRequest } from "@/lib/football-api";

export async function GET() {
  try {
    const data = await footballApiRequest("/status");

    return NextResponse.json({
      success: true,
      message: "API-Football connection successful",
      account: data.response,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "API-Football connection failed",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
