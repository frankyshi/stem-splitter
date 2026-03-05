function ProcessingStatus({ isProcessing, fileId }) {
  if (!fileId && !isProcessing) {
    return null;
  }

  return (
    <section
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderRadius: "1rem",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid rgba(148, 163, 184, 0.2)"
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
        Processing status
      </h2>

      {isProcessing ? (
        <p style={{ color: "#22c55e", fontSize: "0.95rem" }}>
          Splitting your track into stems… (placeholder status)
        </p>
      ) : (
        <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
          {fileId
            ? "Processing complete. Stems are ready to preview or download."
            : "Waiting for an upload."}
        </p>
      )}

      {fileId && (
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            color: "#6b7280"
          }}
        >
          File ID: <code>{fileId}</code>
        </p>
      )}
    </section>
  );
}

export default ProcessingStatus;

