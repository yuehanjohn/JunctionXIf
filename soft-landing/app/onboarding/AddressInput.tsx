"use client";

import * as React from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { cx } from "@/components/ui";

export type AddressChoice = {
  name: string;
  latitude: number;
  longitude: number;
  label: string;
};

type GeocodeResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
};

type Props = {
  id: string;
  label: string;
  placeholder?: string;
  value: AddressChoice | null;
  onChange: (choice: AddressChoice | null) => void;
};

function resultLabel(r: GeocodeResult) {
  return [r.name, r.admin1, r.country].filter(Boolean).join(", ");
}

export function AddressInput({ id, label, placeholder, value, onChange }: Props) {
  const [query, setQuery] = React.useState(value?.label ?? "");
  const [results, setResults] = React.useState<GeocodeResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  // Close the dropdown when clicking anywhere outside.
  React.useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // Debounced geocode search — skipped right after a selection.
  React.useEffect(() => {
    const q = query.trim();
    if (value && q === value.label) return;
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?name=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { ok?: boolean; results?: GeocodeResult[]; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Search failed");
        const hits = data.results ?? [];
        setResults(hits);
        setHighlight(0);
        setError(hits.length === 0 ? "No matches found — try a nearby city or town" : null);
        setOpen(true);
      } catch {
        setResults([]);
        setError("Couldn't reach the address search. Check your connection and try again.");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query, value]);

  function select(r: GeocodeResult) {
    const lbl = resultLabel(r);
    onChange({ name: r.name, latitude: r.latitude, longitude: r.longitude, label: lbl });
    setQuery(lbl);
    setResults([]);
    setOpen(false);
    setError(null);
    setLoading(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    setError(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className={cx(
            "w-full rounded-lg border border-border bg-card py-2.5 pl-9 text-sm outline-none transition-shadow placeholder:text-text-muted focus:ring-2 focus:ring-primary/30",
            value ? "pr-9" : "pr-10"
          )}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" aria-hidden />
          ) : value ? (
            <button
              type="button"
              onClick={clear}
              aria-label={`Clear ${label.toLowerCase()}`}
              className="rounded-full p-0.5 text-text-muted transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {value && (
        <p className="mt-1.5 text-xs text-accent">
          ✓ {value.label}
        </p>
      )}

      {error && !value && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-md"
        >
          {results.map((r, i) => {
            const lbl = resultLabel(r);
            const selected = value?.label === lbl;
            return (
              <li key={`${r.name}-${r.latitude}-${r.longitude}`} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(r)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cx(
                    "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                    i === highlight ? "bg-muted" : "bg-transparent"
                  )}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {r.name}
                      {selected && <span className="ml-1.5 text-xs text-accent">currently selected</span>}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      {[r.admin1, r.country].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
