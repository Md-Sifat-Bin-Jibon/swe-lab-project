"use client";

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SettingsModal({ open, onClose, onSave }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      aria-hidden={false}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="settings-title"
        aria-modal="true"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="settings-title" className="text-xl font-bold text-slate-900">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close settings"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">
              Email notifications
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-swapspot-blue focus:ring-swapspot-blue/20"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">
              Swap reminders
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-swapspot-blue focus:ring-swapspot-blue/20"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">
              Show profile as available
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-swapspot-blue focus:ring-swapspot-blue/20"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="mt-6 w-full rounded-xl bg-swapspot-blue py-3 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
