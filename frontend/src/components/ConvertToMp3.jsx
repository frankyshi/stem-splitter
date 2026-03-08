import { useState } from "react";
import { importYouTubeAudio } from "../services/api.js";

/**
 * Section: "Convert xxx to mp3".
 * V1: YouTube URL → mp3. Structured so we can add more sources (e.g. mp4→mp3) later.
 */
function ConvertToMp3({ setFileId, setStatusMessage }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [importedFilename, setImportedFilename] = useState(null);

  const handleYouTubeImport = async () => {
    const url = youtubeUrl.trim();
    if (!url) {
      setError("Please enter a YouTube URL.");
      return;
    }

    setStatus("loading");
    setError(null);
    if (setStatusMessage) setStatusMessage("Downloading audio…");

    try {
      if (setStatusMessage) setStatusMessage("Converting to mp3…");
      const result = await importYouTubeAudio(url);
      if (!result || result.file_id == null) {
        setError("Invalid response from server.");
        setStatus("error");
        if (setStatusMessage) setStatusMessage("Invalid response from server.");
        return;
      }
      const fileId = result.file_id;
      const filename = result.stored_filename || result.original_filename || "audio.mp3";

      setFileId(fileId);
      setImportedFilename(filename);
      setStatus("success");
      if (setStatusMessage) setStatusMessage("Ready for stem splitting.");
    } catch (e) {
      const message = e?.message || "Import failed.";
      setError(message);
      setStatus("error");
      if (setStatusMessage) setStatusMessage(message);
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
        Convert to mp3
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
        Paste a YouTube URL to download and convert to mp3. You can then split it into stems below.
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
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => {
            setYoutubeUrl(e.target.value);
            setError(null);
          }}
          disabled={status === "loading"}
          style={{
            flex: "1",
            minWidth: "200px",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            color: "#e5e7eb",
            fontSize: "0.95rem"
          }}
        />
        <button
          type="button"
          onClick={handleYouTubeImport}
          disabled={status === "loading"}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "999px",
            border: "none",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            background:
              "linear-gradient(135deg, #22c55e, #16a34a, #22c55e, #22d3ee)",
            color: "#020617",
            fontWeight: 600,
            opacity: status === "loading" ? 0.5 : 1
          }}
        >
          {status === "loading" ? "Importing…" : "Import from YouTube"}
        </button>
      </div>

      {status === "loading" && (
        <p style={{ color: "#22c55e", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Downloading audio… Converting to mp3…
        </p>
      )}

      {error && (
        <p style={{ color: "#f97316", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {status === "success" && importedFilename && (
        <p style={{ color: "#9ca3af", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Ready for stem splitting. Use &quot;Split to stems&quot; below.
        </p>
      )}
    </section>
  );
}

export default ConvertToMp3;
