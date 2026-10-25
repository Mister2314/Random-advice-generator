import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

interface AdviceSlip {
  slip: { id: number; advice: string };
}

type Status = "idle" | "loading" | "error";

const LAST_SLIP_KEY = "rag:lastSlip";
const SAVED_KEY = "rag:savedSlips";

interface SavedSlip {
  id: number;
  advice: string;
}

function readSaved(): SavedSlip[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is SavedSlip =>
        !!s &&
        typeof s === "object" &&
        typeof (s as SavedSlip).id === "number" &&
        typeof (s as SavedSlip).advice === "string",
    );
  } catch {
    return [];
  }
}

function writeSaved(slips: SavedSlip[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(slips));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function readLastSlip(): AdviceSlip["slip"] | null {
  try {
    const raw = localStorage.getItem(LAST_SLIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdviceSlip["slip"];
    return parsed && typeof parsed.advice === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/* Split the advice into word tokens wrapped in clip masks.
   Each word rises out of its mask — the "line rises from the mask"
   editorial look without a split/measure dependency. */
function MaskedWords({ text, runKey }: { text: string; runKey: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className="advice-line" aria-hidden="false">
      {words.map((word, i) => (
        <Fragment key={`${runKey}-${i}`}>
          <span className="word-mask">
            <span
              className="word-rise"
              style={{ animationDelay: `${Math.min(i * 22, 700)}ms` }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

/* Keep-the-slip dock: copy to clipboard and save to localStorage.
   Replaces the third-party Spotify iframe — same corner, same weight,
   zero external requests (evidence: third-party embeds are the top
   Core Web Vitals cost; share/save is the retention feature for
   advice-type tools). */
function KeepSlipDock({
  advice,
  adviceId,
  disabled,
}: {
  advice: string;
  adviceId: string;
  disabled: boolean;
}) {
  const [saved, setSaved] = useState<SavedSlip[]>(readSaved);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const slipId = adviceId.startsWith("Advice #")
    ? Number(adviceId.slice(8))
    : null;
  const isSaved = slipId !== null && saved.some((s) => s.id === slipId);

  const copy = useCallback(async () => {
    const text = `"${advice}" — ${adviceId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "A line of advice", text });
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch {
      /* user dismissed share, or clipboard refused — stay quiet */
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [advice, adviceId]);

  const toggleSave = useCallback(() => {
    if (slipId === null || disabled) return;
    setSaved((prev) => {
      const next = prev.some((s) => s.id === slipId)
        ? prev.filter((s) => s.id !== slipId)
        : [{ id: slipId, advice }, ...prev].slice(0, 20);
      writeSaved(next);
      return next;
    });
  }, [advice, disabled, slipId]);

  const remove = useCallback((id: number) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeSaved(next);
      return next;
    });
  }, []);

  return (
    <aside className="dock" aria-label="Keep this slip">
      <div className="dock-actions">
        <button
          className="dock-btn"
          type="button"
          onClick={() => void copy()}
          disabled={disabled}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          className="dock-btn"
          type="button"
          onClick={toggleSave}
          disabled={disabled}
          aria-pressed={isSaved}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          className="dock-btn dock-btn-quiet"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="saved-list"
        >
          {open ? "Hide" : `Kept ${saved.length}`}
        </button>
      </div>
      {open ? (
        <div className="dock-list" id="saved-list">
          {saved.length === 0 ? (
            <p className="dock-empty">
              Nothing kept yet — generate a slip, then press Save.
            </p>
          ) : (
            saved.map((s) => (
              <p className="dock-item" key={s.id}>
                <span className="dock-item-text">
                  <span className="dock-item-id">#{s.id}</span> {s.advice}
                </span>
                <button
                  className="dock-remove"
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label={`Remove advice #${s.id}`}
                >
                  ✕
                </button>
              </p>
            ))
          )}
        </div>
      ) : null}
    </aside>
  );
}

export default function App() {
  const last = useRef(readLastSlip());
  const [advice, setAdvice] = useState(
    last.current?.advice ?? "Press Space for a line of advice",
  );
  const [adviceId, setAdviceId] = useState(
    last.current ? `Advice #${last.current.id}` : "The counter is open",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [runKey, setRunKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchAdvice = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(
        `https://api.adviceslip.com/advice?cb=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as AdviceSlip;
      if (!data?.slip?.advice) throw new Error("Malformed slip");
      setAdvice(data.slip.advice);
      setAdviceId(`Advice #${data.slip.id}`);
      setStatus("idle");
      setRunKey((k) => k + 1);
      try {
        localStorage.setItem(
          LAST_SLIP_KEY,
          JSON.stringify({ id: data.slip.id, advice: data.slip.advice }),
        );
      } catch {
        /* storage unavailable — non-fatal */
      }
    } catch {
      setStatus("error");
      setRunKey((k) => k + 1);
    }
  }, []);

  /* Keyboard ritual: Space or R generates. The real <button> keeps its
     native Space activation, so we only handle keys outside of controls. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive =
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (interactive) return;
      if (e.code === "Space" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (status !== "loading") void fetchAdvice();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fetchAdvice, status]);

  /* Intersection- and visibility-aware playback. The video only exists as
     ambience: it never plays while the tab is hidden, while the hero is
     scrolled out of view, on small viewports, or under reduced motion. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    let inView = true;

    const sync = () => {
      const shouldPlay =
        inView && !document.hidden && !reduced.matches && desktop.matches;
      if (shouldPlay) {
        void video.play().catch(() => {
          /* autoplay refused — the poster stays, which is fine */
        });
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener?.("change", sync);
    desktop.addEventListener?.("change", sync);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener?.("change", sync);
      desktop.removeEventListener?.("change", sync);
      video.pause();
    };
  }, []);

  return (
    <>
      <main className="hero">
        <video
          ref={videoRef}
          className="cafe-video"
          loop
          muted
          playsInline
          preload="none"
          poster="/assets/video/poster.jpg"
          src="/assets/video/cafe.mp4"
          aria-hidden="true"
        />
        <div className="veil" aria-hidden="true" />

        <section className="stage" aria-live="polite">
          <p className="eyebrow">
            <span className="eyebrow-mark">///</span> {adviceId}
          </p>

          {status === "loading" ? (
            <div className="skeleton" role="status" aria-label="Fetching advice">
              <span className="ink-bar bar-a" />
              <span className="ink-bar bar-b" />
              <span className="ink-bar bar-c" />
            </div>
          ) : status === "error" ? (
            <div className="error-wrap" key={`err-${runKey}`}>
              <p className="error-line">The slip slipped away — no connection.</p>
              <button className="retry" type="button" onClick={() => void fetchAdvice()}>
                Retry <span className="key-hint">R</span>
              </button>
            </div>
          ) : (
            <blockquote className="advice">
              <MaskedWords text={advice} runKey={runKey} />
            </blockquote>
          )}
        </section>

        <div className="controls">
          <button
            className="generate"
            type="button"
            onClick={() => void fetchAdvice()}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Brewing…" : "Generate"}
            <span className="key-hint">Space</span>
          </button>
        </div>

        <KeepSlipDock advice={advice} adviceId={adviceId} disabled={status !== "idle"} />
      </main>
    </>
  );
}
