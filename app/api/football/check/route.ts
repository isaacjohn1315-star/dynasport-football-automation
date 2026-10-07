import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "DynaSport Football Automation",
    status: "online",
    footballApi: "not_configured",
    facebook: "not_configured",
    automation: "not_running",
    timestamp: new Date().toISOString(),
  });
}
