import { useState } from "react";
import { importYouTubeAudio, convertMp4ToMp3 } from "../services/api.js";

const subsectionHeadingStyle = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#e5e7eb",
  marginBottom: "0.5rem"
};

const subsectionBlockStyle = {
  marginTop: "1.25rem",
  paddingTop: "1.25rem",
  borderTop: "1px solid rgba(148, 163, 184, 0.2)"
};

/**
 * Section: "Convert to mp3". Two subsections: YouTube to mp3, mp4 to mp3.
 * Each is self-contained with its own state; same result layout (audio + download).
 */
function ConvertToMp3() {
  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [importedFilename, setImportedFilename] = useState(null);
  const [importedAudioUrl, setImportedAudioUrl] = useState(null);
  const [importedFileId, setImportedFileId] = useState(null);

  // mp4 state
  const [mp4File, setMp4File] = useState(null);
  const [mp4Status, setMp4Status] = useState("idle");
  const [mp4Error, setMp4Error] = useState(null);
  const [mp4AudioUrl, setMp4AudioUrl] = useState(null);
  const [mp4FileId, setMp4FileId] = useState(null);
  const [mp4Filename, setMp4Filename] = useState(null);

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

  const handleMp4Convert = async () => {
    if (!mp4File) {
      setMp4Error("Please select an MP4 file.");
      return;
    }

    setMp4Status("loading");
    setMp4Error(null);
    setMp4AudioUrl(null);
    setMp4FileId(null);

    try {
      const result = await convertMp4ToMp3(mp4File);
      if (!result || result.file_id == null) {
        setMp4Error("Invalid response from server.");
        setMp4Status("error");
        return;
      }
      const fileId = result.file_id;
      const filename = (result.filename || result.stored_filename || result.original_filename) || "audio.mp3";
      const audioUrl = result.audio_url || result.download_url || `/api/download-original/${fileId}`;
      const fullAudioUrl = (audioUrl && audioUrl.startsWith("http")) ? audioUrl : `${window.location.origin}${audioUrl}`;

      setMp4FileId(fileId);
      setMp4Filename(filename);
      setMp4AudioUrl(fullAudioUrl);
      setMp4Status("success");
    } catch (e) {
      const message = (e && e.message) || "Conversion failed.";
      setMp4Error(message);
      setMp4Status("error");
    }
  };

  const resultBlock = (audioUrl, fileId, filename, message) => (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
        {message}
      </p>
      <audio
        controls
        src={audioUrl || (fileId ? `${window.location.origin}/api/download-original/${fileId}` : undefined)}
        style={{ width: "100%", marginBottom: "0.75rem" }}
      />
      <a
        href={audioUrl || (fileId ? `${window.location.origin}/api/download-original/${fileId}` : "#")}
        download={filename || "audio.mp3"}
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
        Download mp3 file
      </a>
    </div>
  );

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
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
        YouTube URL or MP4 file → mp3. Preview and download below. To split into stems, use the section below.
      </p>

      {/* YouTube to mp3 */}
      <h3 style={subsectionHeadingStyle}>YouTube to mp3</h3>
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

      {status === "success" && (importedAudioUrl || importedFileId) && resultBlock(
        importedAudioUrl,
        importedFileId,
        importedFilename,
        "Import complete. Preview and download the mp3 below."
      )}

      {/* Video (mp4, mov) to mp3 */}
      <div style={subsectionBlockStyle}>
        <h3 style={subsectionHeadingStyle}>Video (mp4, mov) to mp3</h3>
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
            accept=".mp4,.mov,video/mp4,video/quicktime"
            onChange={(e) => {
              setMp4File(e.target.files?.[0] ?? null);
              setMp4Error(null);
            }}
            disabled={mp4Status === "loading"}
            style={{
              color: "#e5e7eb",
              maxWidth: "100%",
              opacity: mp4Status === "loading" ? 0.6 : 1
            }}
          />
          <button
            type="button"
            onClick={handleMp4Convert}
            disabled={!mp4File || mp4Status === "loading"}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              cursor: mp4File && mp4Status !== "loading" ? "pointer" : "not-allowed",
              background:
                "linear-gradient(135deg, #22c55e, #16a34a, #22c55e, #22d3ee)",
              color: "#020617",
              fontWeight: 600,
              opacity: mp4File && mp4Status !== "loading" ? 1 : 0.5
            }}
          >
            {mp4Status === "loading" ? "Converting…" : "Convert to mp3"}
          </button>
        </div>

        {mp4Status === "loading" && (
          <p style={{ color: "#22c55e", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            Converting video to mp3…
          </p>
        )}

        {mp4Error && (
          <p style={{ color: "#f97316", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            {mp4Error}
          </p>
        )}

        {mp4Status === "success" && (mp4AudioUrl || mp4FileId) && resultBlock(
          mp4AudioUrl,
          mp4FileId,
          mp4Filename,
          "Conversion complete. Preview and download the mp3 below."
        )}
      </div>
    </section>
  );
}

export default ConvertToMp3;
