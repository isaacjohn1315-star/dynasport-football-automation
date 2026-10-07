import { NextResponse } from "next/server";

export async function GET() {
  const footballApiConfigured = Boolean(
    process.env.FOOTBALL_API_KEY &&
      process.env.FOOTBALL_API_BASE_URL
  );

  const facebookConfigured = Boolean(
    process.env.FACEBOOK_PAGE_ID &&
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN &&
      process.env.FACEBOOK_APP_ID &&
      process.env.FACEBOOK_APP_SECRET
  );

  const automationConfigured = Boolean(process.env.CRON_SECRET);

  return NextResponse.json({
    success: true,
    service: "DynaSport Football Automation",
    status: "online",
    footballApi: footballApiConfigured ? "configured" : "not_configured",
    facebook: facebookConfigured ? "configured" : "not_configured",
    automation: automationConfigured ? "configured" : "not_configured",
    timestamp: new Date().toISOString(),
  });
}
