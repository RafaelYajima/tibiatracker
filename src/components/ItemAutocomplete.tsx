"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Search } from "lucide-react";

interface ItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (itemName: string) => void;
}

export function ItemAutocomplete({ value, onChange, onSelect }: ItemAutocompleteProps) {
  const [results, setResults] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://tibiadata.bytewizards.de/api/v1/items?name=${encodeURIComponent(value.trim())}&pageSize=10`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.items ?? []);
          setOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative" ref={wrapperRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Digite o nome do item..."
        className="w-full rounded-xl border border-night-700 bg-night-950/80 py-3 pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted/40 focus:border-gold-500/50 focus:outline-none"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold-400" />
      )}

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-night-700 bg-night-850 py-1 shadow-2xl">
          {results.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => {
                  onChange(item.name);
                  setOpen(false);
                  if (onSelect) onSelect(item.name);
                }}
                className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-night-800 hover:text-gold-300"
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
