"use client";

const filterIcon = (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M4 6h16M6 12h12M10 18h4" strokeLinecap="round" />
  </svg>
);

const searchIcon = (
  <svg
    className="h-5 w-5 text-slate-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const locationIcon = (
  <svg
    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const chevron = (
  <svg
    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FilterSelect({
  id,
  label,
  placeholder,
  withLocationIcon = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  withLocationIcon?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative">
        {withLocationIcon ? locationIcon : null}
        <select
          id={id}
          className={`w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 text-sm text-slate-600 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20 ${
            withLocationIcon ? "pl-10 pr-10" : "px-4 pr-10"
          }`}
          defaultValue=""
        >
          <option value="">{placeholder}</option>
        </select>
        {chevron}
      </div>
    </div>
  );
}

export interface BrowseFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function BrowseFilters({
  searchValue,
  onSearchChange,
}: BrowseFiltersProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            {searchIcon}
          </span>
          <input
            type="search"
            placeholder="Neha Mayumi"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
          />
        </div>
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-swapspot-blue text-white transition hover:bg-[#3f52c4]"
          aria-label="Open filters"
        >
          {filterIcon}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          id="skills-want"
          label="Skills You Want"
          placeholder="Select Skills"
        />
        <FilterSelect
          id="skills-offer"
          label="Skills You Offer"
          placeholder="Select Skills"
        />
        <FilterSelect
          id="location"
          label="Location"
          placeholder="Location"
          withLocationIcon
        />
        <FilterSelect
          id="status"
          label="Search By Status"
          placeholder="Only Verified"
        />
      </div>
    </div>
  );
}
