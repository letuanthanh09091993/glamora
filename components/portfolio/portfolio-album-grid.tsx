"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import type { PortfolioItem } from "@/lib/auth-types";
import {
  isLikelyDirectVideoFile,
  parseVimeoId,
  parseYoutubeId,
} from "@/lib/portfolio-video-url";

export type AlbumGroup = {
  key: string;
  label: string;
  items: PortfolioItem[];
};

/** 5 cột × 5 dòng = 25 ô mỗi trang */
const ALBUM_PAGE_SIZE = 25;

export function groupPortfolioByAlbum(
  items: PortfolioItem[],
  uncategorizedLabel: string,
): AlbumGroup[] {
  const map = new Map<string, PortfolioItem[]>();
  for (const item of items) {
    const raw = item.album?.trim();
    const key = raw || "__uncat__";
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  const entries = [...map.entries()].map(([key, groupItems]) => ({
    key,
    label: key === "__uncat__" ? uncategorizedLabel : key,
    items: groupItems,
  }));
  entries.sort((a, b) => {
    if (a.key === "__uncat__") return 1;
    if (b.key === "__uncat__") return -1;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
  return entries;
}

type TileSelectProps = {
  selectMode: boolean;
  selected: boolean;
  onToggleSelect?: (id: string) => void;
};

function AlbumMediaTile({ item, selectMode, selected, onToggleSelect }: { item: PortfolioItem } & TileSelectProps) {
  const common =
    "relative aspect-[4/5] min-h-0 overflow-hidden rounded-sm bg-[#e4e6eb] ring-1 ring-black/[0.06]";

  const wrap = (children: ReactNode) => {
    const ring = selected ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-[#fdf8f6]" : "";
    if (selectMode && onToggleSelect) {
      return (
        <div className="relative">
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => onToggleSelect(item.id)}
            className={`${common} block w-full cursor-pointer border-0 p-0 text-left ${ring}`}
          >
            {children}
          </button>
          <span
            aria-hidden
            className={`pointer-events-none absolute left-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md ${
              selected ? "border-pink-600 bg-pink-600 text-white" : "bg-white/95 text-transparent"
            }`}
          >
            {selected ? "✓" : ""}
          </span>
        </div>
      );
    }
    return <div className={common}>{children}</div>;
  };

  if (item.kind === "image") {
    return wrap(
      <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />,
    );
  }

  const url = item.url;
  const yt = parseYoutubeId(url);
  if (yt) {
    return wrap(
      <>
        <img
          src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm text-black shadow-md">
            ▶
          </span>
        </span>
      </>,
    );
  }

  if (parseVimeoId(url)) {
    return wrap(
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm text-black shadow-md">
          ▶
        </span>
      </div>,
    );
  }

  if (isLikelyDirectVideoFile(url)) {
    return wrap(
      <>
        <video
          className="pointer-events-none h-full w-full object-cover"
          preload="metadata"
          muted
          playsInline
          src={url}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm text-black shadow-md">
            ▶
          </span>
        </span>
      </>,
    );
  }

  const short = url.length > 48 ? `${url.slice(0, 46)}…` : url;
  return wrap(
    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-[#f0f2f5] p-1 text-center">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Video</span>
      <span className="line-clamp-4 break-all text-[9px] font-medium leading-snug text-pink-700">{short}</span>
    </div>,
  );
}

function AlbumPagedSection({
  group,
  selectMode,
  selectedIds,
  onToggleSelect,
}: {
  group: AlbumGroup;
  selectMode: boolean;
  selectedIds: readonly string[];
  onToggleSelect?: (id: string) => void;
}) {
  const { t } = useLanguage();
  const total = group.items.length;
  const totalPages = Math.max(1, Math.ceil(total / ALBUM_PAGE_SIZE));
  const [page, setPage] = useState(0);
  const selectedSet = new Set(selectedIds);

  useEffect(() => {
    setPage(0);
  }, [group.key]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages - 1);
  const slice = group.items.slice(safePage * ALBUM_PAGE_SIZE, (safePage + 1) * ALBUM_PAGE_SIZE);

  const pageLabel = t("dashboard.portfolioPreviewPage.albumPageOf")
    .replace("{current}", String(safePage + 1))
    .replace("{total}", String(totalPages));

  return (
    <section>
      <div className="overflow-hidden rounded-lg bg-[#e4e6eb] p-0.5">
        <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
          {slice.map((item) => (
            <AlbumMediaTile
              key={item.id}
              item={item}
              selectMode={selectMode}
              selected={selectedSet.has(item.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      </div>
      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="min-h-9 rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
          >
            {t("dashboard.portfolioPreviewPage.albumBack")}
          </button>
          <span className="text-sm tabular-nums text-gray-600">{pageLabel}</span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="min-h-9 rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
          >
            {t("dashboard.portfolioPreviewPage.albumNext")}
          </button>
        </div>
      ) : null}
    </section>
  );
}

type GridProps = {
  groups: AlbumGroup[];
  selectMode?: boolean;
  selectedIds?: readonly string[];
  onToggleSelect?: (id: string) => void;
};

export function PortfolioAlbumGrid({
  groups,
  selectMode = false,
  selectedIds = [],
  onToggleSelect,
}: GridProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <AlbumPagedSection
          key={group.key}
          group={group}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
