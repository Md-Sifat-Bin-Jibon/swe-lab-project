"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { BioField } from "@/components/ui/BioField";
import { useToast } from "@/hooks/useToast";
import { updateProfile } from "@/services/api";
import type { SessionUser } from "@/types";
import { ProfileInsights } from "./insights/ProfileInsights";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { Avatar } from "@/components/ui/Avatar";

export function OwnProfile({
  user,
  onUpdated,
}: {
  user: SessionUser;
  onUpdated: (user: SessionUser) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [skillsOffer, setSkillsOffer] = useState(user.skillsOffer.join(", "));
  const [skillsWant, setSkillsWant] = useState(user.skillsWant.join(", "));
  const [statsVersion, setStatsVersion] = useState(0);

  function syncFrom(next: SessionUser) {
    setFullName(next.fullName);
    setPhone(next.phone);
    setLocation(next.location);
    setBio(next.bio);
    setAvatar(next.avatar);
    setSkillsOffer(next.skillsOffer.join(", "));
    setSkillsWant(next.skillsWant.join(", "));
  }

  async function handleSave() {
    setBusy(true);
    try {
      const offerList = skillsOffer
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const wantList = skillsWant
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        skillsOffer: offerList,
        skillsWant: wantList,
      });
      onUpdated(updated);
      syncFrom(updated);
      setEditing(false);
      setStatsVersion((v) => v + 1);
      showToast("Profile updated.");
    } catch {
      showToast("Could not update your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and update the details others see about you.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
          >
            Edit profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                syncFrom(user);
                setEditing(false);
              }}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-70"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-swapspot-blue/10 via-swapspot-blue/5 to-transparent px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar
              src={user.avatar}
              name={user.fullName}
              size={112}
              className="rounded-2xl shadow-md ring-4 ring-white"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="flex flex-wrap items-center gap-2 text-3xl font-bold text-slate-900">
                {user.fullName}
                {user.idVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    ID verified
                  </span>
                ) : null}
              </h2>
              <p className="mt-1 text-slate-500">{user.email}</p>
              <p className="mt-1 text-sm text-slate-500">
                {user.location || "Location not set"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-stretch">
              {user.idVerified ? (
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" strokeLinejoin="round" />
                    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified
                </Link>
              ) : (
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" strokeLinejoin="round" />
                  </svg>
                  Verify
                </Link>
              )}
              <Link
                href="/browse"
                className="rounded-lg border-2 border-swapspot-blue px-5 py-2.5 text-center text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
              >
                Browse matches
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {user.balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </p>
            <p className="mt-1 text-sm text-slate-500">Balance</p>
            <Link
              href="/wallet"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-swapspot-blue hover:underline"
            >
              + Add funds
            </Link>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {user.skillsOffer.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Skills you offer</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {user.skillsWant.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Skills you want</p>
          </div>
        </div>
      </article>

      {editing ? (
        <section className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-slate-900">Edit details</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="profile-full-name"
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <FormField
              id="profile-phone"
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <FormField
              id="profile-location"
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <FormField
              id="profile-avatar"
              label="Avatar URL"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="profile-bio"
              className="mb-2 block text-sm font-medium text-slate-500"
            >
              Bio
            </label>
            <BioField
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <FormField
            id="profile-offer"
            label="Skills you offer (comma-separated)"
            value={skillsOffer}
            onChange={(e) => setSkillsOffer(e.target.value)}
            placeholder="Web Development, React"
          />
          <FormField
            id="profile-want"
            label="Skills you want (comma-separated)"
            value={skillsWant}
            onChange={(e) => setSkillsWant(e.target.value)}
            placeholder="Graphic Design, Branding"
          />
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">About</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {user.bio || "No bio yet. Edit your profile to add one."}
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900">
                  {user.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Location</dt>
                <dd className="font-medium text-slate-900">
                  {user.location || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Swap preferences
            </h3>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Offers
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.skillsOffer.length ? (
                    user.skillsOffer.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block rounded-lg bg-swapspot-blue/10 px-3 py-1.5 text-sm font-medium text-swapspot-blue"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">None yet</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Wants
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.skillsWant.length ? (
                    user.skillsWant.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">None yet</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <ProjectsSection ownerName={user.firstName} editable mySkills={user.skillsOffer} />

      <ProfileInsights refreshKey={statsVersion} />
    </div>
  );
}
