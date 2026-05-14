"use client";

import { useEffect, useState } from "react";

type VideoResultProps = {
  jobId: string;
  title: string;
  onReset: () => void;
};

export function VideoResult({ jobId, title, onReset }: VideoResultProps) {
  const videoUrl = `/api/download/${jobId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const filename = `${title.replaceAll(" ", "-").toLowerCase()}.mp4`;

  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-card backdrop-blur-xl"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(14px) scale(0.96)",
        transition:
          "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/55 to-transparent px-6 py-5">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-48 rounded-full bg-emerald-500/18 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                Video completato
              </p>
            </div>
            <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-tight text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onReset}
            className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/65 transition-all hover:bg-white/10 hover:text-white"
          >
            + Nuovo video
          </button>
        </div>
      </div>

      {/* ── Video player ── */}
      <div className="px-6 py-5">
        <div className="relative mx-auto" style={{ maxWidth: 270 }}>
          {/* Glow layers */}
          <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-emerald-500/10 blur-2xl" />
          <div
            className="pointer-events-none absolute -inset-0.5 rounded-[26px]"
            style={{
              background:
                "linear-gradient(160deg, rgba(16,185,129,0.25) 0%, rgba(124,58,237,0.18) 100%)",
            }}
          />
          <video
            src={videoUrl}
            controls
            playsInline
            className="relative mx-auto aspect-[9/16] w-full rounded-3xl bg-black object-contain"
            style={{
              boxShadow:
                "0 0 40px rgba(16,185,129,0.18), 0 20px 60px rgba(0,0,0,0.7)",
            }}
          />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="px-6 pb-6">
        <a
          href={videoUrl}
          download={filename}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold text-white shadow-glow-green transition-all duration-200 hover:bg-emerald-400 hover:scale-[1.015] active:scale-[0.985]"
        >
          <svg
            width="15"
            height="15"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Scarica MP4
        </a>
      </div>
    </div>
  );
}
