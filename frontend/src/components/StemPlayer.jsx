import { downloadStem } from "../services/api.js";

const cardStyle = {
  backgroundColor: "var(--color-surface)",
  borderRadius: "var(--radius-card)",
  padding: "1.75rem",
  border: "1px solid var(--color-surface-border)",
  boxShadow: "var(--shadow-card)"
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

const secondaryButtonStyle = {
  padding: "0.45rem 1rem",
  borderRadius: "var(--radius-button)",
  border: "1px solid var(--color-surface-border-strong)",
  backgroundColor: "transparent",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
  cursor: "pointer"
};

function StemPlayer({ fileId, stems }) {
  const safeStems = Array.isArray(stems) ? stems : [];
  if (fileId == null || fileId === "" || safeStems.length === 0) {
    return null;
  }

  const handleDownload = async (stem) => {
    if (stem && stem.name) await downloadStem(fileId, stem.name);
  };

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Stems preview & download</h2>
      <p style={{ ...bodyTextStyle, marginBottom: "1.25rem" }}>
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
                padding: "1rem 0",
                borderBottom: "1px solid var(--color-surface-border)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <div>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-text)" }}>{name}</span>
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-dim)", fontFamily: "var(--font-body)" }}>
                    ({stem.filename ?? ""})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(stem)}
                  style={secondaryButtonStyle}
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
