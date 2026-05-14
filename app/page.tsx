"use client";

import { useCallback, useState } from "react";
import { GenerationProgress } from "./components/GenerationProgress";
import { PromptForm, GeneratePayload } from "./components/PromptForm";
import { VideoResult } from "./components/VideoResult";

export type JobStatus = {
  status: "pending" | "processing" | "done" | "error";
  current_step: "script" | "tts" | "images" | "video" | null;
  progress: number;
  error: string | null;
  title?: string | null;
};

const FEATURES = [
  { icon: "✍️", label: "Script AI" },
  { icon: "🎙️", label: "Voiceover" },
  { icon: "🖼️", label: "Immagini AI" },
  { icon: "🎬", label: "Video 9:16" },
];

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleGenerate(payload: GeneratePayload) {
    setIsSubmitting(true);
    setSubmitError(null);
    setStatus(null);
    setJobId(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || data.error || "Generazione fallita.");
      setJobId(data.job_id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Errore sconosciuto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleStatusChange = useCallback((s: JobStatus) => setStatus(s), []);

  function reset() {
    setJobId(null);
    setStatus(null);
    setSubmitError(null);
  }

  const isDone = status?.status === "done";
  const isError = status?.status === "error";
  const showForm = !jobId || isError;
  const showProgress = !!jobId && !isDone;

  return (
    <div className="relative min-h-screen bg-[#04040a]">
      {/* ── Ambient orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="animate-float absolute -left-48 -top-48 h-[640px] w-[640px] rounded-full bg-violet-700/14 blur-[130px]"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="animate-float absolute -bottom-32 -right-48 h-[700px] w-[700px] rounded-full bg-blue-600/11 blur-[140px]"
          style={{ animationDelay: "2.5s" }}
        />
        <div
          className="animate-float absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-700/7 blur-[110px]"
          style={{ animationDelay: "5s" }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-glow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 3l14 9-14 9V3z" fill="white" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            Shorts<span className="text-violet-400">AI</span>
          </span>
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-300">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold text-white/50">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Powered by Gemini
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-4 pb-24 pt-6 sm:pt-10">
        {/* Hero */}
        <div
          className="opacity-0 animate-fade-up mb-10 text-center"
          style={{ animationDelay: "80ms" }}
        >
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-violet-400">
            AI Video Generator
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Crea short video
            <br />
            <span className="gradient-text">virali con l&apos;AI</span>
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/45">
            Script, voiceover e immagini verticali coerenti con il parlato.
            Tutto automatico in &lt;90 secondi.
          </p>
        </div>

        {/* Card area */}
        <div
          className="opacity-0 animate-fade-up w-full"
          style={{ animationDelay: "180ms" }}
        >
          {showForm && (
            <PromptForm
              onGenerate={handleGenerate}
              isSubmitting={isSubmitting}
            />
          )}

          {submitError && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
              {submitError}
            </div>
          )}

          {showProgress && (
            <GenerationProgress
              jobId={jobId!}
              onStatusChange={handleStatusChange}
            />
          )}

          {isDone && (
            <VideoResult
              jobId={jobId!}
              title={status?.title || "AI Short"}
              onReset={reset}
            />
          )}
        </div>

        {/* Feature badges */}
        {showForm && !isSubmitting && (
          <div
            className="opacity-0 animate-fade-up mt-8 flex flex-wrap justify-center gap-2"
            style={{ animationDelay: "320ms" }}
          >
            {FEATURES.map(({ icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/50"
              >
                <span>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
