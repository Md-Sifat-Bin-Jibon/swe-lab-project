"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/hooks/useToast";
import {
  addSwapTask,
  deleteSwapTask,
  fetchSwapTasks,
  regenerateSwapTasks,
  setSwapTaskDone,
} from "@/services/api";
import type { SwapTask, SwapTasksPayload } from "@/types";

const CATEGORY: Record<SwapTask["category"], { label: string; className: string }> = {
  teach: { label: "Teach", className: "bg-swapspot-blue/10 text-swapspot-blue" },
  learn: { label: "Learn", className: "bg-emerald-50 text-emerald-700" },
  together: { label: "Together", className: "bg-amber-50 text-amber-700" },
};

function formatDue(value: string | null): { text: string; overdue: boolean } | null {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return null;
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: d.getTime() < Date.now(),
  };
}

function SparkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
    </svg>
  );
}

function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-slate-900">{label}</span>
        <span className="tabular-nums text-slate-500">
          {done}/{total} · {pct}%
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-swapspot-blue"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TaskItem({
  task,
  editable,
  onToggle,
  onDelete,
}: {
  task: SwapTask;
  editable: boolean;
  onToggle?: (task: SwapTask) => void;
  onDelete?: (task: SwapTask) => void;
}) {
  const due = formatDue(task.dueDate);
  const cat = CATEGORY[task.category];
  return (
    <li className="group flex gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50">
      <button
        type="button"
        disabled={!editable}
        onClick={() => onToggle?.(task)}
        aria-pressed={task.done}
        aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.title}`}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
          task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
        } ${editable ? "cursor-pointer hover:border-emerald-500" : "cursor-default"}`}
      >
        {task.done ? (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${task.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
          {task.title}
        </p>
        {task.detail && !task.done ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{task.detail}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`rounded px-1.5 py-0.5 font-semibold ${cat.className}`}>{cat.label}</span>
          {due ? (
            <span className={due.overdue && !task.done ? "font-semibold text-rose-600" : "text-slate-400"}>
              {due.overdue && !task.done ? "Overdue · " : "Due "}
              {due.text}
            </span>
          ) : null}
          {task.source === "manual" ? <span className="text-slate-400">Added by you</span> : null}
        </div>
      </div>
      {editable && task.source === "manual" && onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="self-start rounded px-1.5 text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Delete ${task.title}`}
        >
          ×
        </button>
      ) : null}
    </li>
  );
}

export function SwapPlan({ swapId, readOnly = false }: { swapId: string; readOnly?: boolean }) {
  const { showToast } = useToast();
  const [data, setData] = useState<SwapTasksPayload | null>(null);
  const [error, setError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("");
  const [adding, setAdding] = useState(false);
  const polls = useRef(0);

  const load = useCallback(async () => {
    try {
      setData(await fetchSwapTasks(swapId));
      setError(false);
    } catch {
      setError(true);
    }
  }, [swapId]);

  useEffect(() => {
    polls.current = 0;
    void load();
  }, [load]);

  // Poll while the AI is working (up to ~90s).
  useEffect(() => {
    if (!data || (data.status !== "generating" && data.status !== "none")) return;
    if (polls.current > 36) return;
    const t = setTimeout(() => {
      polls.current += 1;
      void load();
    }, 2500);
    return () => clearTimeout(t);
  }, [data, load]);

  async function toggle(task: SwapTask) {
    if (!data) return;
    // Optimistic update
    setData({ ...data, mine: data.mine.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) });
    try {
      setData(await setSwapTaskDone(swapId, task.id, !task.done));
    } catch {
      showToast("Could not update the task.");
      void load();
    }
  }

  async function remove(task: SwapTask) {
    try {
      setData(await deleteSwapTask(swapId, task.id));
    } catch {
      showToast("Could not delete the task.");
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      setData(await addSwapTask(swapId, newTask.trim(), newDue || null));
      setNewTask("");
      setNewDue("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add the task.");
    } finally {
      setAdding(false);
    }
  }

  async function regenerate() {
    if (!data) return;
    const hasProgress = [...data.mine, ...data.theirs].some((t) => t.done && t.source !== "manual");
    if (
      hasProgress &&
      !window.confirm("Regenerating replaces the current plan for both of you, including ticked items. Continue?")
    ) {
      return;
    }
    setRegenerating(true);
    setData({ ...data, status: "generating" });
    try {
      const next = await regenerateSwapTasks(swapId);
      setData(next);
      showToast(next.status === "ready" ? "New AI plan created." : "Plan refreshed.");
    } catch {
      showToast("Could not regenerate the plan.");
      void load();
    } finally {
      setRegenerating(false);
    }
  }

  const generating = !data || data.status === "generating" || data.status === "none";
  const mineDone = data?.mine.filter((t) => t.done).length ?? 0;
  const theirsDone = data?.theirs.filter((t) => t.done).length ?? 0;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Swap plan</h2>
            {data?.status === "ready" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                <SparkIcon /> AI-generated
              </span>
            ) : data?.status === "template" ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                Standard plan
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            A to-do list for each of you to teach your skill and learn theirs.
          </p>
        </div>
        {!readOnly && data && !generating ? (
          <button
            type="button"
            onClick={() => void regenerate()}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <SparkIcon /> {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        ) : null}
      </div>

      {data?.notice && !generating ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{data.notice}</p>
      ) : null}
      {data && !data.aiEnabled && data.status === "template" && !data.notice ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          AI planning is off (no OpenAI key configured), so a standard plan was used.
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 text-sm text-rose-600">Could not load the plan.</p>
      ) : generating ? (
        <div className="mt-6" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3 rounded-xl bg-violet-50/60 px-4 py-3 text-sm text-violet-800">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" aria-hidden="true" />
            AI is creating a plan for both of you…
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <Progress done={mineDone} total={data.mine.length} label="Your to-dos" />
            <ul className="mt-3 -mx-2">
              {data.mine.map((t) => (
                <TaskItem key={t.id} task={t} editable={!readOnly} onToggle={toggle} onDelete={remove} />
              ))}
            </ul>
            {!readOnly ? (
              <form onSubmit={add} className="mt-3 flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  maxLength={100}
                  placeholder="Add your own to-do…"
                  aria-label="New to-do"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
                />
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  aria-label="Due date (optional)"
                  className="w-36 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-600 focus:border-swapspot-blue focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={adding || !newTask.trim()}
                  className="rounded-lg bg-swapspot-blue px-3 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4] disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            ) : null}
          </div>

          <div>
            <Progress done={theirsDone} total={data.theirs.length} label={`${data.partnerName}'s to-dos`} />
            <ul className="mt-3 -mx-2">
              {data.theirs.map((t) => (
                <TaskItem key={t.id} task={t} editable={false} />
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">Only {data.partnerName} can tick these off.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
