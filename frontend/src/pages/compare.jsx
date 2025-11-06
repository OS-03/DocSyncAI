import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/compare.css";
import { postProcess, postChat, postChatStream } from "../utils/api";

export default function Compare() {
  const navigate = useNavigate();
  const [leftFile, setLeftFile] = useState(null);
  const [rightFile, setRightFile] = useState(null);
  const [leftName, setLeftName] = useState("");
  const [rightName, setRightName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [serverResult, setServerResult] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("docsync_chat_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState("");
  const [selectedFileForChat, setSelectedFileForChat] = useState("All");
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // restore last process result if any
    try {
      const raw = localStorage.getItem("docsync_serverResult");
      if (raw) setServerResult(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    // persist chat history whenever it changes
    try {
      localStorage.setItem("docsync_chat_history", JSON.stringify(chatHistory));
    } catch {}
  }, [chatHistory]);

  // handle file selection / drag drop
  const handleFileSelect = (e, side) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (side === "left") {
      setLeftFile(f);
      setLeftName(f.name);
    } else {
      setRightFile(f);
      setRightName(f.name);
    }
  };

  const handleDrop = (e, side) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (side === "left") {
      setLeftFile(f);
      setLeftName(f.name);
    } else {
      setRightFile(f);
      setRightName(f.name);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // start comparison: send files to backend /process (no mock)
  const startCompare = async () => {
    setError(null);

    // require at least one file to call backend (backend /process expects files)
    if (!leftFile && !rightFile) {
      setError("Please select/upload at least one file to compare.");
      return;
    }

    const form = new FormData();
    if (leftFile) form.append("files", leftFile);
    if (rightFile) form.append("files", rightFile);

    setProcessing(true);
    try {
      // use centralized API helper (VITE_API_URL or default)
      const res = await postProcess(form);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server returned an error from /process");
      }
      const data = await res.json();
      setServerResult(data);
      try {
        localStorage.setItem("docsync_serverResult", JSON.stringify(data));
      } catch {}
    } catch (err) {
      console.error("Compare error:", err);
      setError("Failed to process files. Please check backend and file types.");
      setServerResult(null);
    } finally {
      setProcessing(false);
    }
  };

  // reset diff / HUD info
  const resetCompare = () => {
    setServerResult(null);
    setLeftFile(null);
    setRightFile(null);
    setLeftName("");
    setRightName("");
    setRepoUrl("");
    setError(null);
    // keep chat history or clear? we keep it persisted
  };

  // send chat question to backend /chat
  const handleSendChat = async () => {
    const q = (chatInput || "").trim();
    if (!q) return;
    setError(null);

    // append user message locally
    const userMessage = { role: "user", content: q };
    setChatHistory((h) => {
      const next = [...h, userMessage];
      return next;
    });
    setChatInput("");

    const payload = {
      question: q,
      selected_file: selectedFileForChat === "All" ? null : selectedFileForChat,
    };

    try {
      // Use streaming helper. We'll append a single assistant message and
      // update it as chunks arrive.
      let assistantIndex = null;
      setChatHistory((h) => {
        const next = [...h, { role: "assistant", content: "", streaming: true }];
        assistantIndex = next.length - 1;
        try {
          localStorage.setItem("docsync_chat_history", JSON.stringify(next));
        } catch {}
        return next;
      });

      await postChatStream(payload, (chunk) => {
        // append chunk to assistant message
        setChatHistory((h) => {
          const copy = h.slice();
          if (assistantIndex == null) {
            copy.push({ role: "assistant", content: chunk });
          } else {
            const prev = copy[assistantIndex] || { role: "assistant", content: "" };
            prev.content = (prev.content || "") + chunk;
            prev.streaming = true;
            copy[assistantIndex] = prev;
          }
          try {
            localStorage.setItem("docsync_chat_history", JSON.stringify(copy));
          } catch {}
          return copy;
        });
      });

      // finalize: clear streaming flag
      setChatHistory((h) => {
        const copy = h.slice();
        if (assistantIndex != null && copy[assistantIndex]) {
          delete copy[assistantIndex].streaming;
        }
        try {
          localStorage.setItem("docsync_chat_history", JSON.stringify(copy));
        } catch {}
        return copy;
      });
    } catch (err) {
      console.error(err);
      setError("Chat failed: check backend or processed files.");
      setChatHistory((h) => {
        const next = [...h, { role: "assistant", content: "Error contacting server." }];
        try {
          localStorage.setItem("docsync_chat_history", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  // Theme-based colors
  const theme = document.documentElement.dataset.theme || "dark";
  const rootClass =
    theme === "light"
      ? "compare-root light-theme"
      : "compare-root dark-theme";

  return (
    <div className={rootClass}>
      <main className="compare-main">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Compare — Side by Side</h2>
            <p className="text-sm text-muted">Upload two files (old vs new) to compare and enable chat after processing.</p>
          </div>
          <div className="space-x-2">
            <button className="px-3 py-1 rounded bg-panel text-main hover:bg-purple-700" onClick={resetCompare}>Reset</button>
            <button className="px-4 py-1 rounded bg-purple-600 text-white hover:bg-purple-800" onClick={startCompare} disabled={processing}>
              {processing ? "Processing..." : "Compare"}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left panel */}
          <section
            className="rounded-xl bg-panel p-6 flex flex-col items-center panel-rounded"
            onDrop={(e) => handleDrop(e, "left")}
            onDragOver={handleDragOver}
          >
            <div className="font-semibold mb-2">Old Version</div>
            <input
              id="left-file"
              type="file"
              onChange={(e) => handleFileSelect(e, "left")}
              style={{ display: "none" }}
            />
            <label htmlFor="left-file" className="px-4 py-2 rounded-full bg-purple-600 text-white cursor-pointer mb-2">Choose File</label>
            <div className="text-secondary text-sm">{leftName || "No file selected"}</div>
            <div className="text-xs text-muted">or drop file here</div>
          </section>

          {/* Right panel */}
          <section
            className="rounded-xl bg-panel p-6 flex flex-col items-center panel-rounded"
            onDrop={(e) => handleDrop(e, "right")}
            onDragOver={handleDragOver}
          >
            <div className="font-semibold mb-2">New Version</div>
            <input
              id="right-file"
              type="file"
              onChange={(e) => handleFileSelect(e, "right")}
              style={{ display: "none" }}
            />
            <label htmlFor="right-file" className="px-4 py-2 rounded-full bg-purple-600 text-white cursor-pointer mb-2">Choose File</label>
            <div className="text-secondary text-sm">{rightName || "No file selected"}</div>
            <div className="text-xs text-muted">or drop file here</div>
          </section>
        </div>

        {/* GitHub URL input below */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="text-muted mb-1 block">GitHub / Repo URL (optional)</label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-3 py-2 rounded bg-panel text-main"
            />
          </div>
        </div>

        {/* Result output */}
        {serverResult ? (
          <>
            <div className="rounded-xl bg-panel-2 p-6 mt-6 shadow panel-rounded">
              <div className="flex justify-between items-center mb-2">
                <div>Server Result</div>
                <div className="text-xs text-muted">{(serverResult.file_names || []).join(" , ")}</div>
              </div>
              {serverResult.diff_summary && (
                <div className="mt-3">
                  <h3 className="font-semibold text-purple-300">Document Diff Summary</h3>
                  <p className="text-secondary">{serverResult.diff_summary}</p>
                </div>
              )}
              {serverResult.code_combined_summary && (
                <div className="mt-3">
                  <h3 className="font-semibold text-purple-300">Code Combined Summary</h3>
                  <p className="text-secondary">{serverResult.code_combined_summary}</p>
                </div>
              )}
            </div>

            {serverResult.processed && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 text-purple-300">Ask about these files</h3>
                <div className="flex items-center gap-3 mb-2">
                  <label htmlFor="file-select" className="text-sm text-muted">Context:</label>
                  <select
                    id="file-select"
                    value={selectedFileForChat}
                    onChange={(e) => setSelectedFileForChat(e.target.value)}
                    className="px-2 py-1 rounded bg-panel text-sm text-main"
                  >
                    <option value="All">All</option>
                    {(serverResult.file_names || []).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-panel p-3 rounded max-h-64 overflow-auto mb-3 panel-rounded">
                  {chatHistory.length === 0 && <div className="text-sm text-muted">No messages yet. Ask a question.</div>}
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`mb-2`}>
                      <div className="text-xs text-muted">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                      <div className="text-sm text-main">{m.content}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded bg-panel text-sm text-main"
                    placeholder="Ask a question about the processed files..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                  />
                  <button className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-800" onClick={handleSendChat}>Send</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 text-sm text-muted">No server result yet. Upload files and press Compare.</div>
        )}
      </main>
    </div>
  );
}
