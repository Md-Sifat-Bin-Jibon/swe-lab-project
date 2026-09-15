"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { BioField } from "@/components/ui/BioField";
import { useToast } from "@/hooks/useToast";
import { updateProfile } from "@/services/api";
import type { SessionUser } from "@/types";

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt={user.fullName}
              className="h-28 w-28 rounded-2xl object-cover shadow-md ring-4 ring-white"
              width={112}
              height={112}
            />
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="text-3xl font-bold text-slate-900">
                {user.fullName}
              </h2>
              <p className="mt-1 text-slate-500">{user.email}</p>
              <p className="mt-1 text-sm text-slate-500">
                {user.location || "Location not set"}
              </p>
            </div>
            <Link
              href="/browse"
              className="rounded-lg border-2 border-swapspot-blue px-5 py-2.5 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
            >
              Browse matches
            </Link>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{user.balance}</p>
            <p className="mt-1 text-sm text-slate-500">Balance</p>
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
    </div>
  );
}
