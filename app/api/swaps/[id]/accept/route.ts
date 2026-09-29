import { after, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { acceptProposal, SwapActionError } from "@/lib/swaps";
import { generateSwapTasks, markTasksPending } from "@/lib/swapTasks";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  let swap: ReturnType<typeof acceptProposal>;
  try {
    swap = acceptProposal(db, auth.userId, id);
  } catch (error) {
    if (error instanceof SwapActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  if (!swap) {
    return NextResponse.json(
      {
        error:
          "Proposal not found, already handled, or only the recipient can accept.",
      },
      { status: 404 }
    );
  }

  // Both people get an AI-generated to-do plan; build it after responding
  // so accepting stays instant.
  markTasksPending(db, swap.id);
  after(() => generateSwapTasks(db, swap.id));

  return NextResponse.json({ swap });
}
