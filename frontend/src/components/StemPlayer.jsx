import { downloadStem } from "../services/api.js";

function StemPlayer({ fileId, stems }) {
  const safeStems = Array.isArray(stems) ? stems : [];
  if (fileId == null || fileId === "" || safeStems.length === 0) {
    return null;
  }

  const handleDownload = async (stem) => {
    if (stem && stem.name) await downloadStem(fileId, stem.name);
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
        Preview and download the separated stems below.
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {safeStems.map((stem, index) => {
          if (!stem) return null;
          const name = (stem.name != null && stem.name !== "") ? stem.name : `stem-${index}`;
          return (
            <li
              key={`${name}-${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "0.9rem 0",
                borderBottom: "1px solid rgba(30, 64, 175, 0.25)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem"
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.8rem",
                      color: "#6b7280"
                    }}
                  >
                    ({stem.filename ?? ""})
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
              </div>

              <audio controls src={stem.url ?? ""} style={{ width: "100%" }} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default StemPlayer;