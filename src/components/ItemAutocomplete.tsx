"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Search, Package } from "lucide-react";

interface ItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ItemAutocomplete({ value, onChange, placeholder = "Buscar item..." }: ItemAutocompleteProps) {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounce de busca
  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/items/search?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const items: string[] = data.items ?? [];
          setResults(items);
          setOpen(items.length > 0);
          setHighlightIndex(-1);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  function selectItem(name: string) {
    onChange(name);
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectItem(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/50" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-night-700 bg-night-950/80 py-3 pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted/40 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold-400/70" />
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-night-700 bg-night-850 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)]">
          <div className="px-3 py-2 border-b border-night-700/50">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-muted/60">
              {results.length} {results.length === 1 ? "resultado" : "resultados"} · TibiaWiki
            </p>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {results.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => selectItem(name)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    i === highlightIndex
                      ? "bg-gold-500/10 text-gold-300"
                      : "text-ink hover:bg-night-800"
                  }`}
                >
                  <Package className="h-3.5 w-3.5 shrink-0 text-ink-muted/50" />
                  <span className="truncate font-medium">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mensagem de "nada encontrado" */}
      {open && results.length === 0 && !loading && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-night-700 bg-night-850 px-4 py-3 text-center shadow-xl">
          <p className="text-xs text-ink-muted">Nenhum item encontrado para &quot;{value}&quot;</p>
        </div>
      )}
    </div>
  );
}
