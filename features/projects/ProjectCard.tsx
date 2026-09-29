"use client";

import type { Project } from "@/types";
import { formatCompleted, gradientFor } from "./projectUtils";

export function ProjectCover({ project, className = "" }: { project: Project; className?: string }) {
  const cover = project.images[0];
  if (cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={cover} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" />
    );
  }
  return (
    <div
      className={`flex h-full w-full flex-col justify-end bg-gradient-to-br ${gradientFor(project)} p-4 text-white ${className}`}
      aria-hidden="true"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{project.skill || "Project"}</span>
      <span className="mt-1 line-clamp-2 text-lg font-bold leading-snug">{project.title}</span>
    </div>
  );
}

export function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  onEdit?: (p: Project) => void;
  onDelete?: (p: Project) => void;
}) {
  const completed = formatCompleted(project.completedOn);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100 text-left"
        aria-label={`Open project: ${project.title}`}
      >
        <ProjectCover project={project} className="transition duration-300 group-hover:scale-[1.03]" />
        {project.images.length > 1 ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {project.images.length} photos
          </span>
        ) : null}
      </button>

      {onEdit || onDelete ? (
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(project)}
              className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-rose-600 shadow-sm hover:bg-white"
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={() => onOpen(project)} className="text-left">
          <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 hover:text-swapspot-blue">{project.title}</h3>
        </button>
        {project.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{project.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skill ? (
            <span className="rounded-md bg-swapspot-blue/10 px-2 py-0.5 text-xs font-semibold text-swapspot-blue">
              {project.skill}
            </span>
          ) : null}
          {project.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t}
            </span>
          ))}
        </div>
        {completed || project.duration ? (
          <p className="mt-auto pt-3 text-xs text-slate-400">
            {[project.duration, completed].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}
