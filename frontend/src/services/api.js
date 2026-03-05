const API_BASE = "http://localhost:8000/api";

async function handleJsonResponse(response) {
  if (!response.ok) {
    // Placeholder error handling
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  });

  // In the real implementation, the backend will return a fully
  // defined schema. For now, we just parse JSON.
  return handleJsonResponse(response);
}

export async function requestSplit(fileId) {
  const response = await fetch(`${API_BASE}/split/${fileId}`, {
    method: "POST"
  });
  return handleJsonResponse(response);
}

export async function fetchStems(fileId) {
  const response = await fetch(`${API_BASE}/stems/${fileId}`);
  return handleJsonResponse(response);
}

export async function downloadStem(fileId, stemName) {
  // Placeholder: trigger backend download endpoint.
  // The final implementation should:
  // - Use fetch with "blob" responseType
  // - Create an object URL and simulate a click for download
  const url = new URL(`${API_BASE}/download/${fileId}`);
  url.searchParams.set("stem_name", stemName);

  await fetch(url.toString());
}

