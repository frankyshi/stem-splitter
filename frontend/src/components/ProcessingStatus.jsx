function ProcessingStatus({ isProcessing, fileId, statusMessage }) {
  if (!fileId && !isProcessing && !statusMessage) {
    return null;
  }

  return (
    <section
      style={{
        background:
          "radial-gradient(circle at top left, rgba(79, 70, 229, 0.26), transparent 55%), " +
          "radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.14), transparent 55%), " +
          "var(--color-surface)",
        borderRadius: "var(--radius-card)",
        padding: "1.3rem 1.8rem",
        marginBottom: "1.6rem",
        border: "1px solid var(--color-surface-border)",
        boxShadow: "var(--shadow-card)",
        backdropFilter: "blur(18px)"
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          marginBottom: "0.45rem",
          color: "var(--color-text)",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}
      >
        Processing status
      </h2>

      <p
        style={{
          fontFamily: "var(--font-body)",
          color: isProcessing ? "var(--color-success)" : "var(--color-text-muted)",
          fontSize: "0.95rem",
          margin: 0
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
            color: "var(--color-text-dim)",
            fontFamily: "var(--font-body)"
          }}
        >
          File ID: <code style={{ background: "var(--color-bg-elevated)", padding: "0.15rem 0.35rem", borderRadius: "4px" }}>{fileId}</code>
        </p>
      )}
    </section>
  );
}

export default ProcessingStatus;
