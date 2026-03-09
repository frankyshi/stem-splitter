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
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "3rem 1.5rem",
        fontFamily: "var(--font-body)",
        background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139, 92, 246, 0.07) 0%, transparent 50%), var(--color-bg)",
        color: "var(--color-text)"
      }}
    >
      <section style={{ maxWidth: "920px", width: "100%" }}>
        {/* Hero: title + tagline. Alternatives: "Separate any track into stems. Convert, split, and download." | "Turn any audio into isolated stems—vocals, drums, bass, and more." | "Convert sources to MP3. Split tracks into stems. Professional separation in one place." */}
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
              fontWeight: "normal",
              letterSpacing: "0.02em",
              margin: "0 0 0.75rem",
              color: "var(--color-text)",
              textShadow: "0 0 40px var(--color-accent-subtle)"
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
      </section>
    </main>
  );
}

export default Home;
