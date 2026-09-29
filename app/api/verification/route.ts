import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getVerificationStatus, saveIdDocuments, validateIdImage } from "@/lib/idVerification";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const status = getVerificationStatus(getDb(), auth.userId);
  if (!status) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ verification: status });
}

/** multipart/form-data with `front` and `back` passport images. */
export async function POST(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });

  const frontFile = form.get("front");
  const backFile = form.get("back");
  const front = await validateIdImage(frontFile instanceof File ? frontFile : null, "front of your passport");
  if ("error" in front) return NextResponse.json({ error: front.error, field: "front" }, { status: 400 });
  const back = await validateIdImage(backFile instanceof File ? backFile : null, "back of your passport");
  if ("error" in back) return NextResponse.json({ error: back.error, field: "back" }, { status: 400 });

  if (front.buffer.equals(back.buffer)) {
    return NextResponse.json(
      { error: "The front and back images are identical. Please upload both sides.", field: "back" },
      { status: 400 }
    );
  }

  const db = getDb();
  await saveIdDocuments(db, auth.userId, { front, back });
  return NextResponse.json({ verification: getVerificationStatus(db, auth.userId) }, { status: 201 });
}
