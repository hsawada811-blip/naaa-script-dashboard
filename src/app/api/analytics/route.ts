import { NextResponse } from "next/server";
import { getAppealAnalytics, getDashboardStats } from "@/lib/db/queries";

export async function GET() {
  const stats = getDashboardStats();
  const appealAnalytics = getAppealAnalytics();

  return NextResponse.json({
    stats,
    appealAnalytics,
  });
}
