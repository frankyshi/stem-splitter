import { useState } from "react";
import { importYouTubeAudio, convertMp4ToMp3 } from "../services/api.js";

const cardStyle = {
  backgroundColor: "var(--color-surface)",
  borderRadius: "var(--radius-card)",
  padding: "1.75rem",
  marginBottom: "1.5rem",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--color-surface-border)",
  backdropFilter: "blur(12px)"
};

const sectionTitleStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: "1.25rem",
  marginBottom: "0.5rem",
  color: "var(--color-text)",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase"
};

const subsectionHeadingStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: "1rem",
  fontWeight: 700,
  color: "var(--color-text)",
  marginBottom: "0.6rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase"
};

const bodyTextStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  color: "var(--color-text-muted)",
  lineHeight: 1.5
};

const inputStyle = {
  flex: "1",
  minWidth: "200px",
  padding: "0.65rem 0.9rem",
  borderRadius: "var(--radius-button)",
  border: "1px solid var(--color-surface-border-strong)",
  backgroundColor: "var(--color-bg-elevated)",
  color: "var(--color-text)",
  fontSize: "0.95rem",
  fontFamily: "var(--font-body)"
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

const resultBlockStyle = {
  marginTop: "1.25rem",
  padding: "1rem",
  borderRadius: "var(--radius-button)",
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-surface-border)"
};

const downloadLinkStyle = {
  display: "inline-block",
  padding: "0.5rem 1.1rem",
  borderRadius: "var(--radius-button)",
  border: "1px solid var(--color-surface-border-strong)",
  backgroundColor: "transparent",
  color: "var(--color-text)",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  marginTop: "0.5rem"
};

/**
 * Section: "Convert to mp3". Two subsections: YouTube to mp3, Video (mp4, mov) to mp3.
 */
function ConvertToMp3() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [importedFilename, setImportedFilename] = useState(null);
  const [importedAudioUrl, setImportedAudioUrl] = useState(null);
  const [importedFileId, setImportedFileId] = useState(null);

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
      setError((e && e.message) || "Import failed.");
      setStatus("error");
    }
  };

  const handleMp4Convert = async () => {
    if (!mp4File) {
      setMp4Error("Please select a video file.");
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
      setMp4Error((e && e.message) || "Conversion failed.");
      setMp4Status("error");
    }
  };

  const resultBlock = (audioUrl, fileId, filename, message) => (
    <div style={resultBlockStyle}>
      <p style={{ ...bodyTextStyle, marginBottom: "0.75rem" }}>{message}</p>
      <audio
        controls
        src={audioUrl || (fileId ? `${window.location.origin}/api/download-original/${fileId}` : undefined)}
        style={{ width: "100%", marginBottom: "0.75rem" }}
      />
      <a
        href={audioUrl || (fileId ? `${window.location.origin}/api/download-original/${fileId}` : "#")}
        download={filename || "audio.mp3"}
        style={downloadLinkStyle}
      >
        Download mp3 file
      </a>
    </div>
  );

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Convert to mp3</h2>
      <p style={{ ...bodyTextStyle, marginBottom: "1.25rem" }}>
        YouTube URL or video file → mp3. Preview and download below. To split into stems, use the section below.
      </p>

      <h3 style={subsectionHeadingStyle}>YouTube to mp3</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => { setYoutubeUrl(e.target.value); setError(null); }}
          disabled={status === "loading"}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={handleYouTubeImport}
          disabled={status === "loading"}
          style={primaryButtonStyle(status === "loading")}
        >
          {status === "loading" ? "Importing…" : "Import from YouTube"}
        </button>
      </div>

      {status === "loading" && (
        <p style={{ color: "var(--color-success)", marginTop: "0.75rem", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
          Downloading audio and converting to mp3… this may take up to a minute.
        </p>
      )}
      {error && (
        <p style={{ color: "var(--color-error)", marginTop: "0.75rem", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
          {error}
        </p>
      )}
      {status === "success" && (importedAudioUrl || importedFileId) && resultBlock(
        importedAudioUrl, importedFileId, importedFilename,
        "Import complete. Preview and download the mp3 below."
      )}

      <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-surface-border)" }}>
        <h3 style={subsectionHeadingStyle}>Video (mp4, mov) to mp3</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="file"
            accept=".mp4,.mov,video/mp4,video/quicktime"
            onChange={(e) => { setMp4File(e.target.files?.[0] ?? null); setMp4Error(null); }}
            disabled={mp4Status === "loading"}
            style={{ ...inputStyle, flex: "none", minWidth: "auto", maxWidth: "100%", opacity: mp4Status === "loading" ? 0.6 : 1 }}
          />
          <button
            type="button"
            onClick={handleMp4Convert}
            disabled={!mp4File || mp4Status === "loading"}
            style={primaryButtonStyle(!mp4File || mp4Status === "loading")}
          >
            {mp4Status === "loading" ? "Converting…" : "Convert to mp3"}
          </button>
        </div>

        {mp4Status === "loading" && (
          <p style={{ color: "var(--color-success)", marginTop: "0.75rem", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
            Converting video to mp3…
          </p>
        )}
        {mp4Error && (
          <p style={{ color: "var(--color-error)", marginTop: "0.75rem", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
            {mp4Error}
          </p>
        )}
        {mp4Status === "success" && (mp4AudioUrl || mp4FileId) && resultBlock(
          mp4AudioUrl, mp4FileId, mp4Filename,
          "Conversion complete. Preview and download the mp3 below."
        )}
      </div>
    </section>
  );
}

export default ConvertToMp3;
