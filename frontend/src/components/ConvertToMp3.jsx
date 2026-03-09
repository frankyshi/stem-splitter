import { useState } from "react";
import { importYouTubeAudio } from "../services/api.js";

/**
 * Section: "Convert to mp3". Self-contained: YouTube URL → import → mp3 preview + download.
 * Does not touch shared split state. To split into stems, use the section below (upload a file).
 */
function ConvertToMp3() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [importedFilename, setImportedFilename] = useState(null);
  const [importedAudioUrl, setImportedAudioUrl] = useState(null);
  const [importedFileId, setImportedFileId] = useState(null);

  const handleYouTubeImport = async () => {
    const url = youtubeUrl.trim();
    if (!url) {
      setError("Please enter a YouTube URL.");
      return;
    }

    setStatus("loading");
    setError(null);
    setImportedAudioUrl(null);
    setImportedFileId(null);

    try {
      const result = await importYouTubeAudio(url);
      if (!result || result.file_id == null) {
        setError("Invalid response from server.");
        setStatus("error");
        return;
      }
      const fileId = result.file_id;
      const filename = (result.filename || result.stored_filename || result.original_filename) || "audio.mp3";
      const audioUrl = result.audio_url || result.download_url || `/api/download-original/${fileId}`;
      const fullAudioUrl = (audioUrl && audioUrl.startsWith("http")) ? audioUrl : `${window.location.origin}${audioUrl}`;

      setImportedFileId(fileId);
      setImportedFilename(filename);
      setImportedAudioUrl(fullAudioUrl);
      setStatus("success");
    } catch (e) {
      const message = (e && e.message) || "Import failed.";
      setError(message);
      setStatus("error");
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
        Paste a YouTube URL to download and convert to mp3. Preview and download below. To split into stems, use the section below.
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
          Downloading audio and converting to mp3… this may take up to a minute.
        </p>
      )}

      {error && (
        <p style={{ color: "#f97316", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {status === "success" && (importedAudioUrl || importedFileId) && (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Import complete. Preview and download the mp3 below.
          </p>
          <audio
            controls
            src={importedAudioUrl || (importedFileId ? `${window.location.origin}/api/download-original/${importedFileId}` : undefined)}
            style={{ width: "100%", marginBottom: "0.75rem" }}
          />
          <a
            href={importedAudioUrl || (importedFileId ? `${window.location.origin}/api/download-original/${importedFileId}` : "#")}
            download={importedFilename || "audio.mp3"}
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "1px solid rgba(148, 163, 184, 0.7)",
              backgroundColor: "transparent",
              color: "#e5e7eb",
              textDecoration: "none",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            Download mp3
          </a>
        </div>
      )}
    </section>
  );
}

export default ConvertToMp3;
