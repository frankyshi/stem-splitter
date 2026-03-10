import { useState } from "react";
import { uploadAudio, splitTrack } from "../services/api.js";

const cardStyle = {
  background:
    "radial-gradient(circle at top left, rgba(79, 70, 229, 0.3), transparent 55%), " +
    "radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.16), transparent 55%), " +
    "var(--color-surface)",
  borderRadius: "var(--radius-card)",
  padding: "1.8rem 1.9rem",
  marginBottom: "1.6rem",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--color-surface-border)",
  backdropFilter: "blur(18px)"
};

const sectionTitleStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: "1.15rem",
  marginBottom: "0.5rem",
  color: "var(--color-text)",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase"
};

const bodyTextStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  color: "var(--color-text-muted)",
  lineHeight: 1.6
};

const primaryButtonStyle = (disabled) => ({
  padding: "0.7rem 1.7rem",
  borderRadius: "var(--radius-button)",
  border: "1px solid rgba(196, 181, 253, 0.9)",
  cursor: disabled ? "not-allowed" : "pointer",
  background: disabled
    ? "linear-gradient(135deg, #4b5563 0%, #1f2933 100%)"
    : "linear-gradient(135deg, var(--color-accent) 0%, #4c1d95 35%, #22d3ee 115%)",
  color: "#fdfcff",
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "0.9rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: disabled ? 0.65 : 1,
  boxShadow: disabled ? "none" : "0 12px 30px rgba(15, 23, 42, 0.9), 0 0 0 1px rgba(15, 23, 42, 0.4)",
  transform: disabled ? "none" : "translateY(0)",
  transition: "box-shadow 160ms ease-out, transform 160ms ease-out, opacity 120ms ease-out"
});

const inputFileStyle = (disabled) => ({
  padding: "0.6rem 0.95rem",
  borderRadius: "var(--radius-button)",
  border: "1px dashed rgba(148, 163, 184, 0.7)",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "var(--color-text-muted)",
  maxWidth: "100%",
  fontFamily: "var(--font-body)",
  fontSize: "0.86rem",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1
});

/**
 * Section: "Convert mp3 to stems". Single flow: pick file → Upload & Split.
 */
function UploadAudio({
  fileId,
  isProcessing,
  setFileId,
  setIsProcessing,
  setStems,
  setStatusMessage
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please choose an audio file first.");
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);
      if (setStatusMessage) setStatusMessage("Uploading audio file…");
      const uploadResult = await uploadAudio(selectedFile);
      const newFileId = uploadResult.file_id;
      setFileId(newFileId);
      if (setStatusMessage) setStatusMessage("Splitting stems… longer songs can take a few minutes on CPU.");
      const splitResult = await splitTrack(newFileId);
      setStems(Array.isArray(splitResult?.stems) ? splitResult.stems : []);
      if (setStatusMessage) setStatusMessage("Processing complete. Stems are ready.");
    } catch (e) {
      const message = e?.message || "Upload or processing failed.";
      setError(message);
      if (setStatusMessage) setStatusMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Convert mp3 to stems</h2>
      <p style={{ ...bodyTextStyle, marginBottom: "1rem" }}>
        Upload an audio file to split into separate stems (vocals, drums, bass, other).
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isProcessing}
          style={inputFileStyle(isProcessing)}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isProcessing}
          style={primaryButtonStyle(!selectedFile || isProcessing)}
        >
          {isProcessing ? "Processing…" : "Upload & Split"}
        </button>
      </div>

      {error && (
        <p style={{ color: "var(--color-error)", marginTop: "0.75rem", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
          {error}
        </p>
      )}

      {fileId && !isProcessing && (
        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-dim)", fontFamily: "var(--font-body)" }}>
          Last file: <code style={{ background: "var(--color-bg-elevated)", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>{fileId}</code>
        </p>
      )}
    </section>
  );
}

export default UploadAudio;
