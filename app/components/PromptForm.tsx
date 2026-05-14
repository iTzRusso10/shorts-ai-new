"use client";

import { FormEvent, useState } from "react";

export type GeneratePayload = {
  topic: string;
  language: "it" | "en";
  voice: "male" | "female";
};

type PromptFormProps = {
  onGenerate: (payload: GeneratePayload) => Promise<void>;
  isSubmitting: boolean;
};

const MAX_CHARS = 300;

export function PromptForm({ onGenerate, isSubmitting }: PromptFormProps) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"it" | "en">("it");
  const [voice, setVoice] = useState<"male" | "female">("male");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!topic.trim()) return;
    await onGenerate({ topic: topic.trim(), language, voice });
  }

  const charPct = Math.min((topic.length / MAX_CHARS) * 100, 100);
  const nearLimit = topic.length > MAX_CHARS * 0.85;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-card backdrop-blur-xl sm:p-8"
    >
      {/* Textarea */}
      <div>
        <label
          htmlFor="topic"
          className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400"
        >
          Topic del video
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value.slice(0, MAX_CHARS))}
          placeholder="es. I 3 segreti per dormire meglio ogni notte"
          rows={4}
          className="w-full resize-none rounded-2xl border border-white/10 bg-[#0a0a12] px-4 py-3.5 text-sm text-white outline-none ring-violet-500/25 placeholder:text-white/22 transition-all duration-200 focus:border-violet-500/60 focus:ring-4 focus:bg-[#0c0c18]"
        />
        <div className="mt-1.5 flex items-center justify-end gap-2">
          <div className="h-[3px] w-14 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${charPct}%`,
                background: nearLimit ? "#f59e0b" : "#7c3aed",
                opacity: topic.length > 0 ? 1 : 0,
              }}
            />
          </div>
          <span
            className={`text-[11px] font-medium tabular-nums ${nearLimit ? "text-amber-400" : "text-white/30"}`}
          >
            {topic.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Language toggle */}
        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400">
            Lingua
          </p>
          <div className="flex rounded-xl border border-white/10 bg-[#0a0a12] p-1">
            {(["it", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  language === lang
                    ? "bg-violet-600 text-white shadow-glow-sm"
                    : "text-white/38 hover:text-white/65"
                }`}
              >
                <span>{lang === "it" ? "🇮🇹" : "🇬🇧"}</span>
                {lang === "it" ? "Italiano" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* Voice toggle */}
        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400">
            Voce
          </p>
          <div className="flex rounded-xl border border-white/10 bg-[#0a0a12] p-1">
            {(["male", "female"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVoice(v)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  voice === v
                    ? "bg-violet-600 text-white shadow-glow-sm"
                    : "text-white/38 hover:text-white/65"
                }`}
              >
                <span>{v === "male" ? "👨" : "👩"}</span>
                {v === "male" ? "Maschile" : "Femminile"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={isSubmitting || !topic.trim()}
        className="btn-shimmer mt-6 w-full rounded-2xl px-5 py-4 text-sm font-bold tracking-wide text-white shadow-glow transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Avvio pipeline…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
            </svg>
            Genera Short Video
          </span>
        )}
      </button>

      <p className="mt-4 text-center text-[11px] text-white/22">
        Generazione ~60–90 sec &middot; Formato 9:16 &middot; MP4 pronto
      </p>
    </form>
  );
}
