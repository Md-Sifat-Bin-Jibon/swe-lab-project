import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { submitReview } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const rating = body.rating;

  if (rating === undefined || rating === null || rating === "") {
    return NextResponse.json(
      { error: "Rating is required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const swap = submitReview(db, auth.userId, id, rating);

  if (!swap) {
    return NextResponse.json(
      { error: "Completed swap not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ swap });
}
