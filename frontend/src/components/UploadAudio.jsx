import { useState } from "react";
import { uploadAudio, splitTrack } from "../services/api.js";

function UploadAudio({
  fileId,
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

      if (setStatusMessage) {
        setStatusMessage("Splitting track into stems…");
      }

      const splitResult = await splitTrack(newFileId);
      setStems(splitResult.stems ?? []);

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
        Upload audio
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
        Choose a song or audio file to split into separate stems.
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
          style={{
            color: "#e5e7eb",
            maxWidth: "100%"
          }}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "999px",
            border: "none",
            cursor: selectedFile ? "pointer" : "not-allowed",
            background:
              "linear-gradient(135deg, #22c55e, #16a34a, #22c55e, #22d3ee)",
            color: "#020617",
            fontWeight: 600,
            opacity: selectedFile ? 1 : 0.5
          }}
        >
          Upload & Split
        </button>
      </div>

      {error && (
        <p style={{ color: "#f97316", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {fileId && (
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            color: "#6b7280"
          }}
        >
          Current file ID: <code>{fileId}</code>
        </p>
      )}
    </section>
  );
}

export default UploadAudio;

