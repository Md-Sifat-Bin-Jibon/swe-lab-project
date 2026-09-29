"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { fetchCurrentUser, fetchVerification, submitVerification } from "@/services/api";
import type { VerificationStatus } from "@/types";
import { IdUploadBox } from "./IdUploadBox";

const STEPS = ["Uploading documents", "Checking image quality", "Matching passport details", "Finalising verification"];

function ShieldIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function VerifyIdentity() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    fetchVerification()
      .then(setStatus)
      .catch(() => setStatus({ status: "none", verifiedAt: null, documents: [] }));
  }, []);

  async function handleSubmit() {
    const nextErrors: typeof errors = {};
    if (!front) nextErrors.front = "Please add the front of your passport.";
    if (!back) nextErrors.back = "Please add the back of your passport.";
    setErrors(nextErrors);
    if (nextErrors.front || nextErrors.back || !front || !back) return;
    if (!consent) {
      showToast("Please confirm the documents are yours and consent to verification.");
      return;
    }

    setSubmitting(true);
    setStep(0);
    // Walk through visible steps while the upload + checks run.
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    try {
      const [result] = await Promise.all([
        submitVerification(front, back),
        new Promise((r) => setTimeout(r, STEPS.length * 900)),
      ]);
      setStatus(result);
      setResubmitting(false);
      setFront(null);
      setBack(null);
      setConsent(false);
      fetchCurrentUser().catch(() => {}); // refresh cached session (verified badge)
      showToast("Your identity has been verified.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed.";
      showToast(message);
      if (/front/i.test(message)) setErrors({ front: message });
      else if (/back|identical/i.test(message)) setErrors({ back: message });
    } finally {
      clearInterval(ticker);
      setSubmitting(false);
    }
  }

  if (!status) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  }

  if (status.status === "verified" && !resubmitting) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Your identity is verified</h1>
        <p className="mt-2 text-slate-500">
          Verified on {formatDate(status.verifiedAt)}. A verified badge now shows on your profile and in Browse, so
          other members know they can trust you.
        </p>
        <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left text-sm">
          {status.documents.map((d) => (
            <div key={d.side} className="rounded-xl bg-slate-50 p-3">
              <p className="font-semibold capitalize text-slate-800">Passport {d.side}</p>
              <p className="text-xs text-slate-500">Received {formatDate(d.uploadedAt)}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/profile" className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f52c4]">
            Back to profile
          </Link>
          <button
            type="button"
            onClick={() => setResubmitting(true)}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Update documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/profile" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Back to profile
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Verify your identity</h1>
        <p className="mt-1 text-slate-500">
          Upload clear photos of the front and back of your passport. Verified members get a badge and more swap
          requests.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <IdUploadBox
            side="front"
            title="1. Passport front (photo page)"
            hint="JPG, PNG or WebP · up to 8 MB"
            file={front}
            error={errors.front}
            disabled={submitting}
            onChange={(f, err) => {
              setFront(f);
              setErrors((e) => ({ ...e, front: err }));
            }}
          />
          <IdUploadBox
            side="back"
            title="2. Passport back"
            hint="JPG, PNG or WebP · up to 8 MB"
            file={back}
            error={errors.back}
            disabled={submitting}
            onChange={(f, err) => {
              setBack(f);
              setErrors((e) => ({ ...e, back: err }));
            }}
          />
        </div>

        <ul className="mt-6 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
          <li>✓ All four corners visible</li>
          <li>✓ No glare or blur on the text</li>
          <li>✓ Original document, not a photocopy</li>
          <li>✓ Passport is valid and not expired</li>
        </ul>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-swapspot-blue"
          />
          I confirm this passport belongs to me and I consent to SwapSpot using these images to verify my identity.
          Documents are stored privately and never shown to other members.
        </label>

        {submitting ? (
          <div className="mt-6 rounded-xl border border-swapspot-blue/20 bg-swapspot-blue/5 p-4" aria-live="polite">
            <ul className="space-y-2 text-sm">
              {STEPS.map((label, i) => (
                <li key={label} className={i <= step ? "text-slate-800" : "text-slate-400"}>
                  {i < step ? "✓" : i === step ? "⟳" : "○"} {label}
                  {i === step ? "…" : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldIcon className="h-4 w-4" /> Stored privately · never shown to other members
          </p>
          <div className="flex gap-3">
            {resubmitting ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setResubmitting(false)}
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded-lg bg-swapspot-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-70"
            >
              {submitting ? "Verifying…" : "Submit for verification"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
