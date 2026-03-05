import { downloadStem } from "../services/api.js";

function StemPlayer({ fileId, stems }) {
  if (!fileId || !stems || stems.length === 0) {
    return null;
  }

  const handleDownload = async (stemName) => {
    // Placeholder: call the backend download endpoint.
    // The final implementation should:
    // - Stream or fetch the actual audio blob
    // - Create a temporary link for downloading
    await downloadStem(fileId, stemName);
    // For now, we do not implement the actual download logic.
  };

  return (
    <section
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderRadius: "1rem",
        padding: "1.5rem",
        border: "1px solid rgba(148, 163, 184, 0.2)"
      }}
    >
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Stems preview & download
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
        This is a visual placeholder. Audio playback and actual file downloads
        will be wired up once the backend processing is implemented.
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {stems.map((stem) => (
          <li
            key={stem}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 0",
              borderBottom: "1px solid rgba(30, 64, 175, 0.25)"
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{stem}</span>
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.8rem",
                  color: "#6b7280"
                }}
              >
                (preview placeholder)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDownload(stem)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "999px",
                border: "1px solid rgba(148, 163, 184, 0.7)",
                backgroundColor: "transparent",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: "0.85rem"
              }}
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default StemPlayer;

