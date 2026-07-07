import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SearchIcon } from "@/components/icons";

export function AppGlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function submit() {
    const q = query.trim();
    if (!q) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="relative mx-auto w-full max-w-xl flex-1">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtlest"
      />
      <input
        ref={inputRef}
        aria-label="搜索"
        className="h-9 w-full rounded-md border border-separator bg-surface-sunken pl-9 pr-16 type-body outline-none transition-colors placeholder:text-subtlest focus:border-[var(--ads-color-brand)] focus:bg-surface"
        placeholder="搜索"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-separator bg-surface px-1.5 py-0.5 type-hint sm:inline">
        ⌘K
      </kbd>
    </div>
  );
}
