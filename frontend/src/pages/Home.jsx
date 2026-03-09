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
        padding: "2rem 1rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background:
          "radial-gradient(circle at top, #1e293b 0, #020617 40%, #000 100%)",
        color: "#e5e7eb"
      }}
    >
      <section style={{ maxWidth: "960px", width: "100%" }}>
        <header style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Stem Splitter
          </h1>
          <p style={{ color: "#9ca3af" }}>
            Import from YouTube or upload a track, then split it into stems and preview or download.
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

