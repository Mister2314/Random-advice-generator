import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

interface AdviceSlip {
  slip: { id: number; advice: string };
}

type Status = "idle" | "loading" | "error";

const LAST_SLIP_KEY = "rag:lastSlip";

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

        <aside className="soundtrack" aria-label="Café soundtrack">
          <iframe
            title="Spotify playlist — café soundtrack"
            src="https://open.spotify.com/embed/playlist/5o6yibJ7ztmJm2tuTpyvwt?utm_source=generator"
            width="100%"
            height="232"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </aside>
      </main>
    </>
  );
}
