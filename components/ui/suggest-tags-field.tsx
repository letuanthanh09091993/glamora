"use client";

import { KeyboardEvent, useMemo, useState } from "react";

type SuggestTagsFieldProps = {
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
};

export function SuggestTagsField({
  label,
  hint,
  placeholder,
  values,
  onChange,
  suggestions,
}: SuggestTagsFieldProps) {
  const [draft, setDraft] = useState("");
  const selectedSet = useMemo(() => new Set(values.map((v) => v.toLowerCase())), [values]);

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions.filter((s) => {
      if (selectedSet.has(s.toLowerCase())) return false;
      if (!q) return true;
      return s.toLowerCase().includes(q);
    });
  }, [draft, suggestions, selectedSet]);

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (values.some((v) => v.toLowerCase() === t.toLowerCase())) return;
    onChange([...values, t]);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft.replace(/,$/, ""));
    }
    if (e.key === "Backspace" && !draft && values.length) {
      removeAt(values.length - 1);
    }
  }

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100">
        <div className="flex flex-wrap gap-2">
          {values.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-sm text-black"
            >
              {tag}
              <button
                type="button"
                className="rounded-full px-1 text-gray-500 hover:bg-black/10 hover:text-black"
                aria-label={`Remove ${tag}`}
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="min-w-[12rem] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
      {filteredSuggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {filteredSuggestions.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-pink-300 hover:bg-pink-50"
              onClick={() => addTag(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
