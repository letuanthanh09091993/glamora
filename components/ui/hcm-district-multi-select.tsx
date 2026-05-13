"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Language } from "@/lib/i18n";
import {
  districtKeysToDisplayLine,
  districtOptionLabel,
  HCM_DISTRICT_KEYS,
} from "@/lib/hcm-districts";

type HcmDistrictMultiSelectProps = {
  label: string;
  hint: string;
  placeholder: string;
  language: Language;
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
};

export function HcmDistrictMultiSelect({
  label,
  hint,
  placeholder,
  language,
  selectedKeys,
  onChange,
}: HcmDistrictMultiSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const listId = useId();

  function toggle(key: string) {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  }

  const summary =
    selectedKeys.length > 0
      ? districtKeysToDisplayLine(language, selectedKeys)
      : placeholder;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          onClick={() => setOpen((o) => !o)}
          onFocus={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-black/20 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        >
          <span
            className={`min-w-0 flex-1 truncate ${selectedKeys.length ? "text-black" : "text-gray-400"}`}
          >
            {summary}
          </span>
          <span
            className={`shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {selectedKeys.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggle(key);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black ring-1 ring-black/10 hover:bg-black/10"
              >
                {districtOptionLabel(language, key)}
                <span className="text-gray-500">×</span>
              </button>
            ))}
          </div>
        ) : null}

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-black/10 bg-white py-1 shadow-lg ring-1 ring-black/5"
          >
            {HCM_DISTRICT_KEYS.map((key) => {
              const selected = selectedKeys.includes(key);
              return (
                <li key={key} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-pink-50 focus:bg-pink-50 focus:outline-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(key)}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none ${
                        selected ? "border-black bg-black text-white" : "border-black/25 bg-white"
                      }`}
                      aria-hidden
                    >
                      {selected ? "✓" : null}
                    </span>
                    <span className="min-w-0 flex-1">{districtOptionLabel(language, key)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
    </div>
  );
}
