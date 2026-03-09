function ProcessingStatus({ isProcessing, fileId, statusMessage }) {
  if (!fileId && !isProcessing && !statusMessage) {
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

      <p
        style={{
          color: isProcessing ? "#22c55e" : "#9ca3af",
          fontSize: "0.95rem"
        }}
      >
        {statusMessage
          ? statusMessage
          : isProcessing
          ? "Splitting stems… longer songs can take a few minutes on CPU."
          : fileId
          ? "Processing complete. Stems are ready to preview or download."
          : "Upload a file above to split into stems."}
      </p>

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

