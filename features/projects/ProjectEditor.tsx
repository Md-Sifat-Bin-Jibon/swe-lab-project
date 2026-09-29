"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { saveProject } from "@/services/api";
import type { Project } from "@/types";

const MAX_IMAGES = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** An image slot is either an already-saved URL or a newly picked file. */
type Slot = { key: string; kind: "existing"; url: string } | { key: string; kind: "new"; file: File; preview: string };

const input =
  "w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20";

export function ProjectEditor({
  project,
  mySkills,
  onClose,
  onSaved,
}: {
  project: Project | null;
  mySkills: string[];
  onClose: () => void;
  onSaved: (p: Project) => void;
}) {
  const skillListId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(project?.title ?? "");
  const [skill, setSkill] = useState(project?.skill ?? mySkills[0] ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [tags, setTags] = useState<string[]>(project?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [projectUrl, setProjectUrl] = useState(project?.projectUrl ?? "");
  const [duration, setDuration] = useState(project?.duration ?? "");
  const [completedOn, setCompletedOn] = useState(project?.completedOn?.slice(0, 7) ?? "");
  const [slots, setSlots] = useState<Slot[]>(
    () => project?.images.map((url) => ({ key: url, kind: "existing" as const, url })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URLs for new previews on unmount.
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  useEffect(
    () => () => slotsRef.current.forEach((s) => s.kind === "new" && URL.revokeObjectURL(s.preview)),
    []
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = [...slots];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES) {
        setError(`Up to ${MAX_IMAGES} images per project.`);
        break;
      }
      if (!ACCEPT.includes(file.type)) {
        setError(`"${file.name}" isn't a JPG, PNG, WebP or GIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" is larger than 5 MB.`);
        continue;
      }
      next.push({ key: `${file.name}-${file.size}-${Math.random()}`, kind: "new", file, preview: URL.createObjectURL(file) });
    }
    setSlots(next);
  }

  function removeSlot(key: string) {
    setSlots((s) => {
      const slot = s.find((x) => x.key === key);
      if (slot?.kind === "new") URL.revokeObjectURL(slot.preview);
      return s.filter((x) => x.key !== key);
    });
  }

  function makeCover(key: string) {
    setSlots((s) => {
      const slot = s.find((x) => x.key === key);
      return slot ? [slot, ...s.filter((x) => x.key !== key)] : s;
    });
  }

  function addTag() {
    const t = tagDraft.trim().replace(/,$/, "");
    if (t && tags.length < 8 && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) setTags([...tags, t.slice(0, 30)]);
    setTagDraft("");
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Give your project a title.");
      return;
    }

    const form = new FormData();
    form.set("title", title.trim());
    form.set("skill", skill.trim());
    form.set("description", description.trim());
    form.set("tags", JSON.stringify(tagDraft.trim() ? [...tags, tagDraft.trim()] : tags));
    form.set("projectUrl", projectUrl.trim());
    form.set("duration", duration.trim());
    form.set("completedOn", completedOn);

    const order: string[] = [];
    let n = 0;
    for (const s of slots) {
      if (s.kind === "existing") order.push(s.url);
      else {
        form.append("images", s.file);
        order.push(`new:${n++}`);
      }
    }
    form.set("order", JSON.stringify(order));

    setSaving(true);
    try {
      onSaved(await saveProject(form, project?.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the project.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-editor-title"
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id="project-editor-title" className="text-xl font-bold text-slate-900">
            {project ? "Edit project" : "Add a project"}
          </h2>
          <p className="text-sm text-slate-500">Show members what you can do — real work builds trust.</p>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-600">Images</span>
              <span className="text-xs text-slate-400">
                {slots.length}/{MAX_IMAGES} · first image is the cover
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {slots.map((s, i) => (
                <div key={s.key} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.kind === "existing" ? s.url : s.preview} alt="" className="h-full w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded bg-swapspot-blue px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      Cover
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    {i > 0 ? (
                      <button type="button" onClick={() => makeCover(s.key)} className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-slate-800">
                        Make cover
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => removeSlot(s.key)}
                      className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600"
                      aria-label="Remove image"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {slots.length < MAX_IMAGES ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-swapspot-blue hover:text-swapspot-blue"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-xs font-semibold">Add images</span>
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT.join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
              aria-label="Add project images"
            />
          </div>

          <div>
            <label htmlFor="project-title" className="mb-1.5 flex justify-between text-sm font-medium text-slate-600">
              Title <span className="text-xs font-normal text-slate-400">{title.length}/80</span>
            </label>
            <input id="project-title" className={input} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand identity for a coffee roaster" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-skill" className="mb-1.5 block text-sm font-medium text-slate-600">
                Main skill
              </label>
              <input id="project-skill" list={skillListId} className={input} maxLength={60} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. Web Development" />
              <datalist id={skillListId}>
                {mySkills.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="project-tags" className="mb-1.5 block text-sm font-medium text-slate-600">
                Tags <span className="font-normal text-slate-400">(press Enter)</span>
              </label>
              <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 focus-within:border-swapspot-blue focus-within:ring-2 focus-within:ring-swapspot-blue/20">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-0.5 pl-2 pr-1 text-xs text-slate-700">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="px-0.5 text-slate-400 hover:text-slate-700" aria-label={`Remove ${t}`}>
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="project-tags"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={onTagKey}
                  onBlur={addTag}
                  disabled={tags.length >= 8}
                  placeholder={tags.length ? "" : "Logo, Figma…"}
                  className="min-w-[80px] flex-1 border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="project-description" className="mb-1.5 flex justify-between text-sm font-medium text-slate-600">
              Description <span className="text-xs font-normal text-slate-400">{description.length}/1500</span>
            </label>
            <textarea
              id="project-description"
              rows={5}
              maxLength={1500}
              className={`${input} resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was the goal, what did you do, and what was the result?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label htmlFor="project-url" className="mb-1.5 block text-sm font-medium text-slate-600">
                Link <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input id="project-url" type="url" className={input} value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label htmlFor="project-duration" className="mb-1.5 block text-sm font-medium text-slate-600">
                Duration
              </label>
              <input id="project-duration" className={input} maxLength={40} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2 weeks" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="project-completed" className="mb-1.5 block text-sm font-medium text-slate-600">
                Completed
              </label>
              <input id="project-completed" type="month" className={input} value={completedOn} onChange={(e) => setCompletedOn(e.target.value)} />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-swapspot-blue px-5 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4] disabled:opacity-70">
            {saving ? "Saving…" : project ? "Save changes" : "Publish project"}
          </button>
        </div>
      </form>
    </div>
  );
}
