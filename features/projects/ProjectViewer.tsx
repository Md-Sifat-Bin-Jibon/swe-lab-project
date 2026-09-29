"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types";
import { ProjectCover } from "./ProjectCard";
import { formatCompleted, hostOf } from "./projectUtils";

export function ProjectViewer({
  project,
  ownerName,
  onClose,
}: {
  project: Project;
  ownerName?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const count = project.images.length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && count > 1) setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft" && count > 1) setIndex((i) => (i - 1 + count) % count);
    }
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [count, onClose]);

  const completed = formatCompleted(project.completedOn);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-viewer-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative aspect-[16/9] w-full shrink-0 bg-slate-900">
          {count ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.images[index]} alt={`${project.title} — image ${index + 1} of ${count}`} className="h-full w-full object-contain" />
          ) : (
            <ProjectCover project={project} />
          )}
          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-800 shadow hover:bg-white"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % count)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-800 shadow hover:bg-white"
                aria-label="Next image"
              >
                ›
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white">
                {index + 1} / {count}
              </span>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg text-slate-700 shadow hover:bg-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {count > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-6 py-3">
            {project.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  i === index ? "ring-swapspot-blue" : "ring-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Show image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="overflow-y-auto p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="project-viewer-title" className="text-2xl font-bold text-slate-900">
                {project.title}
              </h2>
              {ownerName ? <p className="mt-1 text-sm text-slate-500">by {ownerName}</p> : null}
            </div>
            {project.projectUrl ? (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-swapspot-blue px-4 py-2 text-sm font-semibold text-swapspot-blue hover:bg-swapspot-blue/5"
              >
                Visit {hostOf(project.projectUrl)} ↗
              </a>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.skill ? (
              <span className="rounded-md bg-swapspot-blue/10 px-2.5 py-1 text-sm font-semibold text-swapspot-blue">
                {project.skill}
              </span>
            ) : null}
            {project.tags.map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
                {t}
              </span>
            ))}
          </div>

          {project.duration || completed ? (
            <dl className="mt-5 grid max-w-md grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-semibold text-slate-900">{project.duration || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Completed</dt>
                <dd className="font-semibold text-slate-900">{completed || "—"}</dd>
              </div>
            </dl>
          ) : null}

          {project.description ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">About this project</h3>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{project.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
