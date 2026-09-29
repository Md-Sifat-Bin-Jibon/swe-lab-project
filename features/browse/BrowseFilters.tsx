"use client";

import { useState } from "react";
import {
  activeFilterCount,
  STATUS_OPTIONS,
  type BrowseFilterState,
  type StatusFilter,
} from "./filterState";
import { MultiSelectFilter, SingleSelectFilter } from "./FilterDropdown";

const filterIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 6h16M6 12h12M10 18h4" strokeLinecap="round" />
  </svg>
);

const searchIcon = (
  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const locationIcon = (
  <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export interface BrowseFiltersProps {
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  options: { offeredSkills: string[]; wantedSkills: string[]; locations: string[] };
  mySkills: { offer: string[]; want: string[] };
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-swapspot-blue/10 py-1 pl-3 pr-1.5 text-sm font-medium text-swapspot-blue">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded hover:bg-swapspot-blue/15"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}

export function BrowseFilters({ filters, onChange, options, mySkills }: BrowseFiltersProps) {
  const [expanded, setExpanded] = useState(true);
  const count = activeFilterCount(filters);
  const set = (patch: Partial<BrowseFilterState>) => onChange({ ...filters, ...patch });

  // "Your skills" are shown first so the most relevant choices are one click away.
  const wantGroups = [
    { label: "Skills you want", options: mySkills.want },
    { label: "Offered by members", options: options.offeredSkills },
  ];
  const offerGroups = [
    { label: "Skills you offer", options: mySkills.offer },
    { label: "Wanted by members", options: options.wantedSkills },
  ];

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filters.status)?.label;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">{searchIcon}</span>
          <input
            type="search"
            placeholder="Search by name, skill or location"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            aria-label="Search members"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls="browse-filter-panel"
          aria-label={expanded ? "Hide filters" : "Show filters"}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-swapspot-blue text-white transition hover:bg-[#3f52c4]"
        >
          {filterIcon}
          {count ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-bold">
              {count}
            </span>
          ) : null}
        </button>
      </div>

      {expanded ? (
        <div id="browse-filter-panel" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelectFilter
            label="Skills You Want"
            placeholder="Select Skills"
            value={filters.want}
            onChange={(want) => set({ want })}
            groups={wantGroups}
          />
          <MultiSelectFilter
            label="Skills You Offer"
            placeholder="Select Skills"
            value={filters.offer}
            onChange={(offer) => set({ offer })}
            groups={offerGroups}
          />
          <SingleSelectFilter
            label="Location"
            placeholder="Any location"
            value={filters.location}
            onChange={(location) => set({ location })}
            options={options.locations.map((l) => ({ value: l, label: l }))}
            icon={locationIcon}
          />
          <SingleSelectFilter
            label="Search By Status"
            placeholder="All members"
            value={filters.status}
            onChange={(status) => set({ status: (status || "all") as StatusFilter })}
            options={STATUS_OPTIONS}
            clearable={false}
          />
        </div>
      ) : null}

      {count ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {filters.want.map((s) => (
            <Chip key={`w-${s}`} label={`Offers: ${s}`} onRemove={() => set({ want: filters.want.filter((x) => x !== s) })} />
          ))}
          {filters.offer.map((s) => (
            <Chip key={`o-${s}`} label={`Wants: ${s}`} onRemove={() => set({ offer: filters.offer.filter((x) => x !== s) })} />
          ))}
          {filters.location ? <Chip label={filters.location} onRemove={() => set({ location: "" })} /> : null}
          {filters.status !== "all" && statusLabel ? (
            <Chip label={statusLabel} onRemove={() => set({ status: "all" })} />
          ) : null}
          <button
            type="button"
            onClick={() => onChange({ ...filters, want: [], offer: [], location: "", status: "all" })}
            className="ml-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
