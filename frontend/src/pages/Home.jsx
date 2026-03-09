import ConvertToMp3 from "../components/ConvertToMp3.jsx";
import UploadAudio from "../components/UploadAudio.jsx";
import ProcessingStatus from "../components/ProcessingStatus.jsx";
import StemPlayer from "../components/StemPlayer.jsx";
import { useState } from "react";

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
      {/* Layered gradient background */}
      <div className="stem-splitter-bg" aria-hidden="true" />

      {/* Floating decorative layer — replace .floating-art-panel with img or background-image for custom assets */}
      <div className="stem-splitter-bg-art" aria-hidden="true">
        <div className="floating-art-panel floating-art-panel--1" />
        <div className="floating-art-panel floating-art-panel--2" />
        <div className="floating-art-panel floating-art-panel--3" />
        <div className="floating-art-panel floating-art-panel--4" />
        <div className="floating-art-panel floating-art-panel--5" />
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
