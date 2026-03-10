import ConvertToMp3 from "../components/ConvertToMp3.jsx";
import UploadAudio from "../components/UploadAudio.jsx";
import ProcessingStatus from "../components/ProcessingStatus.jsx";
import StemPlayer from "../components/StemPlayer.jsx";
import { useState } from "react";
import { useFloatingCovers } from "../hooks/useFloatingCovers.js";

// Master pool of album art; hook only shows a subset at once.
const FLOATING_ART_IMAGES = [
  "/images/mbdtf.jpg",
  "/images/tpab.jpg",
  "/images/astroworld.jpg",
  "/images/graduation.jpg",
  "/images/808s%20and%20heartbreak.jpg",
  "/images/late%20registration.jpg",
  "/images/ye.jpg",
  "/images/levon%20james.jpg",
  "/images/damn.jpg",
  "/images/one%20of%20wun.jpg",
  "/images/iamiwas.jpg",
  "/images/jesus%20is%20king.jpg",
  "/images/the%20college%20dropout.jpg",
  "/images/nas.jpg",
  "/images/grandson.jpg",
  "/images/watch%20the%20throne.jpg",
  "/images/issa.jpg",
  "/images/maad%20city.jpg",
  "/images/yeezus.jpg",
  "/images/life%20of%20pablo.jpg",
  "/images/444.jpg",
  "/images/scorpion.jpg",
  "/images/wlr.jpg",
  "/images/hardstone%20psycho.jpg",
  "/images/the%20blueprint.jpg",
  "/images/future.jpg",
  "/images/utopia.jpg",
  "/images/ds2.jpg",
  "/images/rodeo.jpg",
  "/images/gnx.jpg",
  "/images/the%20blueprint%203.jpg",
  "/images/be.jpg",
  "/images/die%20lit.jpg",
  "/images/take%20care.jpg",
  "/images/nothing%20was%20the%20same.jpg",
  "/images/octane.jpg",
];

function Home() {
  const [fileId, setFileId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const { covers, setRef } = useFloatingCovers(FLOATING_ART_IMAGES);

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
        {covers.map((cover, i) => (
          <div
            key={cover.id}
            ref={(el) => setRef(i, el)}
            className="floating-art-img-wrap floating-art-img-wrap--flow"
            style={{
              left: cover.x,
              top: cover.y,
              width: cover.size,
              height: cover.size,
              opacity: cover.opacity,
            }}
          >
            <img src={cover.src} alt="" className="floating-art-img" />
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
            paddingTop: "3rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(148, 163, 184, 0.22)"
          }}
        >
          <h1
            style={{
              fontFamily: "Acme, var(--font-heading)",
              fontSize: "clamp(3rem, 6vw, 5rem)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 0.9rem",
              lineHeight: 1.1,
              backgroundImage:
                "linear-gradient(135deg, #e5e7eb 0%, #c4b5fd 32%, #a855f7 68%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 52px rgba(88, 28, 135, 0.6)"
            }}
          >
            STEMSMITH
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.98rem",
              lineHeight: 1.6,
              color: "var(--color-text-muted)",
              margin: 0,
              maxWidth: "40ch",
              marginLeft: "auto",
              marginRight: "auto"
            }}
          >
            Convert any source to MP3, then split it into stems—vocals, drums, bass, and more. Perfect for isolating vocals, flipping samples, building drum kits, and shaping rough ideas into records.
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
