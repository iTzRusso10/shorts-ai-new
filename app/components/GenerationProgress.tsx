"use client";

import { useEffect, useState } from "react";
import type { JobStatus } from "../page";

const STEPS = [
  { key: "script", label: "Script", sub: "Generazione contenuto", icon: "✍️" },
  { key: "tts", label: "Voiceover", sub: "Sintesi vocale AI", icon: "🎙️" },
  { key: "images", label: "Immagini", sub: "Generazione visivi", icon: "🖼️" },
  { key: "video", label: "Video", sub: "Composizione finale", icon: "🎬" },
] as const;

const RADIUS = 46;
const CIRC = 2 * Math.PI * RADIUS;

type Props = { jobId: string; onStatusChange: (s: JobStatus) => void };

export function GenerationProgress({ jobId, onStatusChange }: Props) {
  const [status, setStatus] = useState<JobStatus>({
    status: "pending",
    current_step: "script",
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || data.error || "Errore stato job.");
        if (alive) {
          setStatus(data);
          onStatusChange(data);
        }
        if (data.status === "done" || data.status === "error")
          clearInterval(timer);
      } catch (e) {
        const err: JobStatus = {
          status: "error",
          current_step: null,
          progress: 0,
          error: e instanceof Error ? e.message : "Errore sconosciuto.",
        };
        if (alive) {
          setStatus(err);
          onStatusChange(err);
        }
        clearInterval(timer);
      }
    }

    poll();
    timer = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [jobId, onStatusChange]);

  const activeIdx = STEPS.findIndex((s) => s.key === status.current_step);
  const offset = CIRC * (1 - status.progress / 100);

  return (
    <div className="animate-scale-in overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-card backdrop-blur-xl">
      {/* ── Ring header ── */}
      <div className="relative flex flex-col items-center bg-gradient-to-b from-violet-950/35 to-transparent px-6 py-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-44 rounded-full bg-violet-600/15 blur-3xl" />
        </div>

        {/* SVG progress ring */}
        <div className="relative z-10">
          <svg
            width="116"
            height="116"
            className="-rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="58"
              cy="58"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="7"
            />
            <circle
              cx="58"
              cy="58"
              r={RADIUS}
              fill="none"
              stroke="url(#ring-grad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold tabular-nums text-white">
              {status.progress}%
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/38">
              progress
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-4 text-center">
          <h2 className="text-base font-bold text-white">
            Generazione in corso…
          </h2>
          {status.title && (
            <p className="mt-1 text-xs text-white/40 line-clamp-1">
              &ldquo;{status.title}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="space-y-2 p-5">
        {STEPS.map((step, i) => {
          const done =
            status.status === "done" || (activeIdx >= 0 && i < activeIdx);
          const active =
            step.key === status.current_step && status.status === "processing";
          const pending = !done && !active;

          return (
            <div
              key={step.key}
              className={`relative flex items-center gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 transition-all duration-500 ${
                active
                  ? "animate-pulse-glow border-violet-500/50 bg-violet-500/[0.09]"
                  : done
                    ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                    : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              {/* Shimmer sweep on active */}
              {active && (
                <div
                  className="step-sweep pointer-events-none absolute inset-0 w-2/5"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(139,92,246,0.07), transparent)",
                  }}
                />
              )}

              {/* Icon */}
              <div
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active
                    ? "bg-violet-600/30"
                    : done
                      ? "bg-emerald-500/20"
                      : "bg-white/[0.04]"
                }`}
              >
                {done ? (
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : active ? (
                  <svg
                    className="h-4 w-4 animate-spin-slow text-violet-300"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-80"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <span className={pending ? "opacity-30" : ""}>
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${pending ? "text-white/28" : "text-white"}`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-[11px] ${
                    active
                      ? "text-violet-300/65"
                      : done
                        ? "text-emerald-400/60"
                        : "text-white/20"
                  }`}
                >
                  {step.sub}
                </p>
              </div>

              {/* Badge */}
              {active && (
                <span className="shrink-0 rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Attivo
                </span>
              )}
              {done && (
                <span className="shrink-0 text-[11px] font-semibold text-emerald-400/70">
                  Fatto
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {status.status === "error" && (
        <div className="mx-5 mb-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">
            Errore
          </p>
          <p className="mt-1 text-sm text-red-200">
            {status.error || "La generazione non è riuscita."}
          </p>
        </div>
      )}
    </div>
  );
}
