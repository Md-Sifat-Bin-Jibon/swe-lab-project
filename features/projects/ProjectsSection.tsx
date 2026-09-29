"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { fetchProjects, removeProject } from "@/services/api";
import type { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";
import { ProjectEditor } from "./ProjectEditor";
import { ProjectViewer } from "./ProjectViewer";

const MAX_PROJECTS = 12;

export function ProjectsSection({
  userId,
  ownerName,
  editable = false,
  mySkills = [],
}: {
  /** Omit for the signed-in user. */
  userId?: string;
  ownerName: string;
  editable?: boolean;
  mySkills?: string[];
}) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [viewing, setViewing] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      setProjects(await fetchProjects(userId));
    } catch {
      setProjects([]);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(p: Project) {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await removeProject(p.id);
      setProjects((list) => (list ?? []).filter((x) => x.id !== p.id));
      showToast("Project deleted.");
    } catch {
      showToast("Could not delete the project.");
    }
  }

  const count = projects?.length ?? 0;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" aria-labelledby="projects-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="projects-heading" className="text-lg font-bold text-slate-900">
            Projects {count ? <span className="font-medium text-slate-400">({count})</span> : null}
          </h3>
          <p className="text-sm text-slate-500">
            {editable ? "Showcase work that proves your skills." : `Work ${ownerName} has done.`}
          </p>
        </div>
        {editable && count > 0 && count < MAX_PROJECTS ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-lg bg-swapspot-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4]"
          >
            + Add project
          </button>
        ) : null}
      </div>

      {projects === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : count === 0 ? (
        editable ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center transition hover:border-swapspot-blue hover:bg-swapspot-blue/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-swapspot-blue/10 text-2xl text-swapspot-blue">+</span>
            <span className="mt-3 font-semibold text-slate-900">Add your first project</span>
            <span className="mt-1 max-w-sm text-sm text-slate-500">
              Upload photos of real work, describe what you did and link to it. Profiles with projects get more swap requests.
            </span>
          </button>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {ownerName} hasn&apos;t added any projects yet.
          </p>
        )
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={setViewing}
              onEdit={editable ? (x) => setEditing(x) : undefined}
              onDelete={editable ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {viewing ? <ProjectViewer project={viewing} ownerName={editable ? undefined : ownerName} onClose={() => setViewing(null)} /> : null}

      {editing ? (
        <ProjectEditor
          project={editing === "new" ? null : editing}
          mySkills={mySkills}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setProjects((list) => {
              const rest = (list ?? []).filter((x) => x.id !== saved.id);
              return editing === "new" ? [saved, ...rest] : (list ?? []).map((x) => (x.id === saved.id ? saved : x));
            });
            showToast(editing === "new" ? "Project published." : "Project updated.");
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}
