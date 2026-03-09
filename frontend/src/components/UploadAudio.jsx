import { useState } from "react";
import { uploadAudio, splitTrack } from "../services/api.js";

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
      if (setStatusMessage) {
        setStatusMessage("Uploading audio file…");
      }

      const uploadResult = await uploadAudio(selectedFile);
      const newFileId = uploadResult.file_id;
      setFileId(newFileId);

      if (setStatusMessage) setStatusMessage("Splitting stems… longer songs can take a few minutes on CPU.");

      const splitResult = await splitTrack(newFileId);
      setStems(Array.isArray(splitResult?.stems) ? splitResult.stems : []);

      if (setStatusMessage) {
        setStatusMessage("Processing complete. Stems are ready.");
      }
    } catch (e) {
      const message = e?.message || "Upload or processing failed.";
      setError(message);
      if (setStatusMessage) {
        setStatusMessage(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        marginBottom: "1.5rem"
      }}
    >
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Convert mp3 to stems
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
        Upload an audio file to split into separate stems (vocals, drums, bass, other).
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center"
        }}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isProcessing}
          style={{
            color: "#e5e7eb",
            maxWidth: "100%",
            opacity: isProcessing ? 0.6 : 1
          }}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isProcessing}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "999px",
            border: "none",
            cursor: selectedFile && !isProcessing ? "pointer" : "not-allowed",
            background:
              "linear-gradient(135deg, #22c55e, #16a34a, #22c55e, #22d3ee)",
            color: "#020617",
            fontWeight: 600,
            opacity: selectedFile && !isProcessing ? 1 : 0.5
          }}
        >
          {isProcessing ? "Processing…" : "Upload & Split"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#f97316", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {fileId && !isProcessing && (
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            color: "#6b7280"
          }}
        >
          Last file: <code>{fileId}</code>
        </p>
      )}
    </section>
  );
}

export default UploadAudio;

