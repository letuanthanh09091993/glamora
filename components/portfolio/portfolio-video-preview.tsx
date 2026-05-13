"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import {
  isLikelyDirectVideoFile,
  parseVimeoId,
  parseYoutubeId,
} from "@/lib/portfolio-video-url";

type Props = {
  url: string;
  className?: string;
};

/**
 * Shows an inline preview; playback starts after an explicit user action (no autoplay).
 * YouTube/Vimeo: thumbnail or placeholder first, iframe loads on click. Direct files: native video with controls.
 */
export function PortfolioVideoPreview({ url, className = "" }: Props) {
  const { t } = useLanguage();
  const playLabel = t("dashboard.portfolioPreviewPage.videoPlayAria");
  const yt = parseYoutubeId(url);
  const vm = parseVimeoId(url);
  const [embedOn, setEmbedOn] = useState(false);

  const wrap = `w-full max-w-full ${className}`.trim();

  if (yt) {
    if (!embedOn) {
      return (
        <button
          type="button"
          onClick={() => setEmbedOn(true)}
          className={`group relative aspect-video overflow-hidden rounded-2xl border border-black/10 bg-black text-left ${wrap}`}
          aria-label={playLabel}
        >
          <img
            src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-xl text-black shadow-lg"
              aria-hidden
            >
              ▶
            </span>
          </span>
        </button>
      );
    }
    return (
      <div className={`aspect-video overflow-hidden rounded-2xl border border-black/10 bg-black ${wrap}`}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt}?rel=0&autoplay=0`}
          title="YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (vm) {
    if (!embedOn) {
      return (
        <button
          type="button"
          onClick={() => setEmbedOn(true)}
          className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-gray-800 to-gray-950 text-white ${wrap}`}
          aria-label={playLabel}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-xl text-black shadow-lg"
            aria-hidden
          >
            ▶
          </span>
        </button>
      );
    }
    return (
      <div className={`aspect-video overflow-hidden rounded-2xl border border-black/10 bg-black ${wrap}`}>
        <iframe
          className="h-full w-full"
          src={`https://player.vimeo.com/video/${vm}?autoplay=0`}
          title="Vimeo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isLikelyDirectVideoFile(url)) {
    return (
      <video
        className={`aspect-video rounded-2xl border border-black/10 bg-black object-contain ${wrap}`}
        controls
        preload="none"
        playsInline
        src={url}
      >
        {url}
      </video>
    );
  }

  return (
    <div className={`flex min-h-[120px] flex-col justify-center rounded-2xl border border-black/10 bg-white p-4 ${wrap}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Video</p>
      <a
        className="mt-2 break-all text-sm font-medium text-pink-600 hover:underline"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {t("dashboard.portfolioPreviewPage.openVideo")}
      </a>
    </div>
  );
}
