import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";

export async function GET() {
  try {
    await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: "DynaSport database initialized successfully",
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
