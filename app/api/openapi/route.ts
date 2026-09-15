import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(openApiSpec);
}
