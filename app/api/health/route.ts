import { NextResponse } from "next/server";
import { CATALOG } from "@/lib/catalog";

export const runtime = "nodejs";

// Tells the client whether real YouCam calls are possible. Never reveals the key itself.
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.YOUCAM_API_KEY?.trim()),
    mock: process.env.YOUCAM_MOCK === "1",
    stylesReady: CATALOG.filter((s) => s.templateId).map((s) => s.id),
  });
}
