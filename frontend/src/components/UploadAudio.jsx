import { useState } from "react";
import { uploadAudio, splitTrack } from "../services/api.js";

const cardStyle = {
  backgroundColor: "var(--color-surface)",
  borderRadius: "var(--radius-card)",
  padding: "1.75rem",
  marginBottom: "1.5rem",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--color-surface-border)"
};

const sectionTitleStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: "1.35rem",
  marginBottom: "0.5rem",
  color: "var(--color-text)",
  fontWeight: "normal",
  letterSpacing: "0.02em"
};

const bodyTextStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  color: "var(--color-text-muted)",
  lineHeight: 1.5
};

const primaryButtonStyle = (disabled) => ({
  padding: "0.65rem 1.5rem",
  borderRadius: "var(--radius-button)",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  background: disabled
    ? "var(--color-text-dim)"
    : "linear-gradient(135deg, var(--color-accent) 0%, #7c3aed 100%)",
  color: "#fff",
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "0.9rem",
  opacity: disabled ? 0.6 : 1,
  boxShadow: disabled ? "none" : "0 2px 12px rgba(139, 92, 246, 0.35)"
});

const inputFileStyle = (disabled) => ({
  color: "var(--color-text)",
  maxWidth: "100%",
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  opacity: disabled ? 0.6 : 1
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
