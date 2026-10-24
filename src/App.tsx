import { useState } from "react";
import "./styles.css";

interface AdviceSlip {
  slip: { id: number; advice: string };
}

export default function App() {
  const [advice, setAdvice] = useState(
    "Tap Generate to begin something wonderful"
  );
  const [adviceId, setAdviceId] = useState("Are you ready?");
  const [error, setError] = useState(false);

  const handleGenerate = () => {
    fetch("https://api.adviceslip.com/advice")
      .then((response) => {
        if (!response.ok) {
          throw new Error("its error");
        }
        return response.json() as Promise<AdviceSlip>;
      })
      .then((data) => {
        setError(false);
        setAdvice(data.slip.advice);
        setAdviceId(`Advice #${data.slip.id}`);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(true);
      });
  };

  return (
    <>
      <iframe
        style={{ borderRadius: "12px" }}
        src="https://open.spotify.com/embed/playlist/5o6yibJ7ztmJm2tuTpyvwt?utm_source=generator"
        width="100%"
        height={352}
        frameBorder={0}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
      <section className="hero">
        <video autoPlay loop muted src="/assets/video/Anime Coffee Shop Live Wallpaper PC 4K - HX_Slowed (1080p60, h264, youtube).mp4" />
        <div className="container">
          <div className="up">
            <h4 className="adviceId">{error ? "Something went wrong" : adviceId}</h4>
          </div>
          <div className="bottom">
            <h2 className="advice">{error ? "Could not fetch advice. Please try again." : advice}</h2>
          </div>
          <div className="button" onClick={handleGenerate}>
            <h2>Generate</h2>
          </div>
        </div>
      </section>
    </>
  );
}
