import ConvertToMp3 from "../components/ConvertToMp3.jsx";
import UploadAudio from "../components/UploadAudio.jsx";
import ProcessingStatus from "../components/ProcessingStatus.jsx";
import StemPlayer from "../components/StemPlayer.jsx";
import { useState } from "react";

/* Curated slots so images stay well-separated; center (content area) kept clear. */
const FLOATING_ART_CONFIG = [
  { src: "/images/mbdtf.jpg", top: "6%", left: "3%", size: "clamp(120px, 16vw, 220px)", anim: "float-slow", duration: 28, delay: 0, opacity: 0.28 },
  { src: "/images/tpab.jpg", top: "10%", left: "78%", size: "clamp(100px, 14vw, 200px)", anim: "float-slower", duration: 34, delay: -8, opacity: 0.26 },
  { src: "/images/astroworld.jpg", top: "54%", left: "0%", size: "clamp(110px, 15vw, 210px)", anim: "drift", duration: 36, delay: -12, opacity: 0.24 },
  { src: "/images/graduation.jpg", top: "48%", left: "82%", size: "clamp(100px, 14vw, 190px)", anim: "float-slow", duration: 30, delay: -18, opacity: 0.27 },
  { src: "/images/damn.jpg", top: "76%", left: "5%", size: "clamp(100px, 14vw, 195px)", anim: "float-slower", duration: 32, delay: -5, opacity: 0.25 },
  { src: "/images/iamiwas.jpg", top: "74%", left: "72%", size: "clamp(110px, 15vw, 205px)", anim: "drift", duration: 38, delay: -22, opacity: 0.26 },
];

function Home() {
  const [fileId, setFileId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  return (
    <main
      className="stem-splitter-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "3rem 1.5rem",
        fontFamily: "var(--font-body)",
        color: "var(--color-text)"
      }}
    >
      <div className="stem-splitter-bg" aria-hidden="true" />

      <div className="stem-splitter-bg-art" aria-hidden="true">
        {FLOATING_ART_CONFIG.map((item, i) => (
          <div
            key={item.src + i}
            className={`floating-art-img-wrap floating-art-img-wrap--${item.anim}`}
            style={{
              top: item.top,
              left: item.left,
              width: item.size,
              height: item.size,
              opacity: item.opacity,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            <img src={item.src} alt="" className="floating-art-img" />
          </div>
        ))}
      </div>

      <div
        className="stem-splitter-content"
        style={{ maxWidth: "920px", width: "100%" }}
      >
        <header
          style={{
            marginBottom: "3rem",
            textAlign: "center",
            paddingBottom: "2rem",
            borderBottom: "1px solid var(--color-surface-border)"
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 0.75rem",
              color: "var(--color-text)",
              textTransform: "uppercase",
              textShadow: "0 0 48px var(--color-accent-subtle)"
            }}
          >
            Stem Splitter
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              lineHeight: 1.5,
              color: "var(--color-text-muted)",
              margin: 0,
              maxWidth: "36ch",
              marginLeft: "auto",
              marginRight: "auto"
            }}
          >
            Convert any source to MP3, then split into stems—vocals, drums, bass, and more.
          </p>
        </header>

        <ConvertToMp3 />

        <UploadAudio
          fileId={fileId}
          isProcessing={isProcessing}
          setFileId={setFileId}
          setIsProcessing={setIsProcessing}
          setStems={setStems}
          setStatusMessage={setStatusMessage}
        />

        <ProcessingStatus
          isProcessing={isProcessing}
          fileId={fileId}
          statusMessage={statusMessage}
        />

        <StemPlayer fileId={fileId} stems={Array.isArray(stems) ? stems : []} />
      </div>
    </main>
  );
}

export default Home;
