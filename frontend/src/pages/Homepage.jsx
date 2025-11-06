import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/homepage.css";
import { account } from "../appwriteConfig";
import { AuthContext } from "../context/AuthContext";

export default function Homepage() {
  const uploadRef = useRef(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("new");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);

  const { user: authUser } = useContext(AuthContext);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const onGetStarted = () => {
    if (uploadRef.current) {
      uploadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      navigate("/compare");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUrlGo = () => {
    if (url.trim() !== "") {
      localStorage.setItem("docsync_last_url", url.trim());
      navigate("/compare");
    }
  };

  // Theme-based colors
  const theme = document.documentElement.dataset.theme || "dark";
  const rootClass =
    theme === "light"
      ? "home-root light-theme"
      : "home-root dark-theme";

  return (
    <div className={rootClass}>
      {/* Hero section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-light mb-4">
          Spot Every <span className="font-bold text-purple-400">Change.</span>
          <br />
          Perfect Every <span className="font-bold text-purple-400">Version</span>
        </h1>
        <p className="text-muted max-w-xl mx-auto mb-6">
          Paste a document URL or upload your files to find version differences
          and quality issues.
        </p>
        <div className="flex justify-center gap-4 mb-8">
          <button
            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold text-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition"
            onClick={onGetStarted}
          >
            Get Started
          </button>
          <Link
            to="/compare"
            className="px-8 py-4 rounded-full bg-panel text-main font-bold text-lg shadow hover:bg-purple-700 transition"
          >
            Try Compare
          </Link>
        </div>
      </section>

      {/* Upload section */}
      <section ref={uploadRef} className="flex justify-center pb-20">
  <div className="w-full max-w-xl bg-panel rounded-xl p-8 shadow-lg panel-rounded">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-full ${
                  activeTab === "new"
                    ? "bg-purple-600 text-white"
                    : "bg-panel text-secondary"
                }`}
                onClick={() => setActiveTab("new")}
              >
                New Upload
              </button>
              <button
                className={`px-4 py-2 rounded-full ${
                  activeTab === "recent"
                    ? "bg-purple-600 text-white"
                    : "bg-panel text-secondary"
                }`}
                onClick={() => setActiveTab("recent")}
              >
                Recent
              </button>
            </div>
            <div className="text-muted">⚙️</div>
          </div>

          <div
            className="h-48 rounded-xl bg-panel-2 flex items-center justify-center mb-4 cursor-pointer panel-rounded"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            role="button"
            tabIndex={0}
            onKeyDown={() => {}}
          >
            <div className="text-center">
              <div className="text-lg font-semibold text-secondary">
                Click to browse or drag & drop your files
              </div>
              <div className="text-sm text-muted mt-2">
                Supported: .pdf .docx .txt .zip
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-panel rounded-full px-4 py-2 panel-rounded">
              <span className="text-lg">🔗</span>
              <input
                className="flex-1 bg-transparent border-none outline-none text-main text-base px-2"
                placeholder="Paste document or repo URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlGo();
                }}
              />
              <button
                className="px-4 py-2 rounded-full bg-purple-600 text-white"
                onClick={handleUrlGo}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto flex justify-between items-center text-muted py-6 px-4 border-t border-muted">
        <div className="font-bold text-purple-300">◈ DocSyncAI</div>
        <div className="flex gap-8">
          <div>Community</div>
          <div>Legal</div>
        </div>
      </footer>
    </div>
  );
}
