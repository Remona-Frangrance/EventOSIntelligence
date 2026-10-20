import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkDatabaseConnection();
  return NextResponse.json({
    ...status,
    databaseUrlMasked: (process.env.DATABASE_URL || "").replace(/:[^:@]+@/, ":****@"),
    recommendedProvider: "Neon.tech (Free Serverless PostgreSQL) or Supabase",
    setupTip: "Create a free Postgres DB on neon.tech or supabase.com and put DATABASE_URL in .env.local",
  });
}
