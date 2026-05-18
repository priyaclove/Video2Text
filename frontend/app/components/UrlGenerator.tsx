"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, PlayCircleIcon } from "./icons";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type RqStatus =
  | "queued"
  | "started"
  | "deferred"
  | "scheduled"
  | "finished"
  | "failed"
  | "canceled"
  | "stopped";

type JobResponse = {
  job_id: string;
  status: RqStatus;
  download_url: string | null;
  error: string | null;
};

type UiState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "polling"; job: JobResponse }
  | { kind: "done"; job: JobResponse }
  | { kind: "error"; message: string };

const FRIENDLY_STATUS: Record<RqStatus, string> = {
  queued: "Queued",
  scheduled: "Queued",
  deferred: "Queued",
  started: "Processing video",
  finished: "Done",
  failed: "Failed",
  canceled: "Canceled",
  stopped: "Stopped",
};

export function UrlGenerator() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  function stopPolling() {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function reset() {
    stopPolling();
    setUrl("");
    setState({ kind: "idle" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || state.kind === "submitting" || state.kind === "polling")
      return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const text = await res.text();
        setState({ kind: "error", message: text || `HTTP ${res.status}` });
        return;
      }
      const job = (await res.json()) as JobResponse;
      setState({ kind: "polling", job });
      startPolling(job.job_id);
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error
            ? `Could not reach backend: ${err.message}`
            : "Could not reach backend.",
      });
    }
  }

  function startPolling(jobId: string) {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`);
        if (!res.ok) return;
        const job = (await res.json()) as JobResponse;
        if (job.status === "finished") {
          stopPolling();
          setState({ kind: "done", job });
        } else if (
          job.status === "failed" ||
          job.status === "canceled" ||
          job.status === "stopped"
        ) {
          stopPolling();
          setState({
            kind: "error",
            message: job.error ?? `Job ${job.status}`,
          });
        } else {
          setState({ kind: "polling", job });
        }
      } catch {
        // transient — retry next tick
      }
    }, 1500);
  }

  const isBusy = state.kind === "submitting" || state.kind === "polling";

  return (
    <div className="w-full max-w-3xl glass-card rounded-2xl p-6 md:p-10 ai-glow relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col md:flex-row gap-4"
      >
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <PlayCircleIcon className="w-6 h-6 text-on-surface-variant" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube video URL..."
            required
            disabled={isBusy}
            className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={isBusy}
          className="bg-primary text-on-primary px-8 py-4 rounded-xl font-semibold whitespace-nowrap hover:shadow-[0_0_20px_rgba(194,193,255,0.4)] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state.kind === "submitting"
            ? "Submitting…"
            : state.kind === "polling"
            ? "Processing…"
            : "Generate Installation Guide"}
        </button>
      </form>

      {state.kind === "polling" && (
        <div className="relative mt-6 flex items-center justify-center gap-3 text-sm text-on-surface-variant">
          <Spinner />
          <span>
            {FRIENDLY_STATUS[state.job.status]}…{" "}
            <span className="font-mono text-xs opacity-70">
              job {state.job.job_id.slice(0, 8)}
            </span>
          </span>
        </div>
      )}

      {state.kind === "done" && state.job.download_url && (
        <div className="relative mt-6 flex flex-col items-center gap-3">
          <span className="text-sm text-on-surface-variant">
            Your guide is ready.
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`${API_BASE}${state.job.download_url}`}
              download
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(194,193,255,0.4)] active:scale-95 transition-all"
            >
              Download Guide
            </a>
            <button
              type="button"
              onClick={reset}
              className="border border-white/10 text-on-surface px-6 py-3 rounded-xl font-semibold hover:bg-white/5 transition-colors"
            >
              Process another
            </button>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="relative mt-6 flex flex-col items-center gap-3">
          <span className="text-sm text-error">{state.message}</span>
          <button
            type="button"
            onClick={reset}
            className="border border-white/10 text-on-surface px-6 py-3 rounded-xl font-semibold hover:bg-white/5 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6">
        <BadgeItem>4K Extraction</BadgeItem>
        <BadgeItem>Markdown Ready</BadgeItem>
        <BadgeItem>Multi-language support</BadgeItem>
      </div>
    </div>
  );
}

function BadgeItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs tracking-wider">
      <CheckCircleIcon className="w-4 h-4" />
      <span>{children}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin text-primary"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
