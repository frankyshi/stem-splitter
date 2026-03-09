const API_BASE = "/api";

async function handleJsonResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    console.error("[api] handleJsonResponse:", e);
    const msg = response.ok
      ? "Invalid response from server."
      : `Request failed with status ${response.status}`;
    throw new Error(msg);
  }

  if (!response.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function importYouTubeAudio(url) {
  const response = await fetch(`${API_BASE}/import/youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url.trim() })
  });
  return handleJsonResponse(response);
}

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  });

  return handleJsonResponse(response);
}

export async function splitTrack(fileId) {
  const response = await fetch(`${API_BASE}/split/${fileId}`, {
    method: "POST"
  });
  const data = await handleJsonResponse(response);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response from server.");
  }
  return {
    ...data,
    stems: Array.isArray(data.stems) ? data.stems : []
  };
}

export async function listStems(fileId) {
  const response = await fetch(`${API_BASE}/stems/${fileId}`);
  return handleJsonResponse(response);
}

export async function downloadStem(fileId, stemName) {
  const url = new URL(`${API_BASE}/download/${fileId}`, window.location.origin);
  url.searchParams.set("stem", stemName);

  const response = await fetch(url.toString());
  if (!response.ok) {
    let message = `Download failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        message = data.detail;
      }
    } catch (e) {
      // ignore JSON parse errors for non-JSON responses
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${stemName}.wav`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}


