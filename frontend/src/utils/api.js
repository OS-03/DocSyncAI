// src/utils/api.js
// Centralize backend URL and helper fetch wrappers.

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function postProcess(formData) {
  const res = await fetch(`${BASE}/process`, { method: "POST", body: formData });
  return res;
}

// Simple non-streaming chat (fallback)
async function postChat(payload) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

// Streaming chat helper: calls onMessage(chunkText) for each chunk received.
// Returns a promise that resolves when stream ends. If the backend doesn't
// stream, this will still call onMessage once with the full body.
async function postChatStream(payload, onMessage) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Chat stream request failed");
  }

  // If there's no body, return
  if (!res.body) {
    const txt = await res.text();
    onMessage(txt);
    return { done: true };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;
  let buffer = "";

  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      // Try to split by newlines or send whole buffer as chunk
      const parts = buffer.split(/\n/);
      // keep last partial in buffer
      buffer = parts.pop();
      for (const p of parts) {
        if (p.trim()) onMessage(p);
      }
    }
  }

  if (buffer.trim()) onMessage(buffer);
  return { done: true };
}

async function getReport() {
  const res = await fetch(`${BASE}/report`);
  return res;
}

export { BASE, postProcess, postChat, postChatStream, getReport };
