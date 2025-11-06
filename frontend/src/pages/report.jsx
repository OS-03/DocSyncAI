import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/report.css";
import { getReport } from "../utils/api";

export default function Report() {
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastServerResult, setLastServerResult] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("docsync_reports");
    if (raw) {
      try {
        setReports(JSON.parse(raw));
      } catch (e) {
        setReports([]);
      }
    }
    try {
      const srv = localStorage.getItem("docsync_serverResult");
      if (srv) setLastServerResult(JSON.parse(srv));
    } catch {}
  }, []);

  const persist = (items) => {
    localStorage.setItem("docsync_reports", JSON.stringify(items));
  };

  // Generate a report from backend
  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await getReport();
      if (!res.ok) throw new Error("No processed comparison found.");
      const blob = await res.blob();
      const now = new Date();
      const id = Math.random().toString(36).slice(2, 9);
      const title = `Report • ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      const entry = {
        id,
        title,
        summary: "Report generated from backend.",
        createdAt: now.getTime(),
        blobUrl: URL.createObjectURL(blob),
      };
      const updated = [entry, ...reports];
      setReports(updated);
      persist(updated);
      setShowReports(true);
    } catch (err) {
      alert("No last comparison found. Please run a comparison on the Compare page first.");
    }
    setGenerating(false);
  };

  const downloadPdf = (report) => {
    if (report.blobUrl) {
      const a = document.createElement("a");
      a.href = report.blobUrl;
      a.download = `${report.id}_report.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const viewReport = (report) => {
    window.open(report.blobUrl, "_blank");
  };

  const clearReports = () => {
    setReports([]);
    persist([]);
    setShowReports(false);
  };

  // Theme-based colors
  const theme = document.documentElement.dataset.theme || "dark";
  const rootClass =
    theme === "light"
      ? "reports-root light-theme"
      : "reports-root dark-theme";

  return (
    <div className={rootClass}>
      <main className="reports-main">
        <section className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-muted mb-4">
            Generate detailed reports from your comparisons. Use the button below to create a report from the last backend result.
          </p>
          <button
            className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:from-purple-600 hover:to-purple-800 transition"
            onClick={generateReport}
            disabled={generating}
          >
            {generating ? "Generating…" : "Create Report from Last Comparison"}
          </button>
          <p className="text-muted mt-2">{reports.length === 0 ? "No reports yet — create one from your last comparison." : `${reports.length} saved report(s)`}</p>
        </section>

        <section className={`${showReports || reports.length ? "block" : "hidden"} mb-8`}>
          <div className="flex justify-between items-center mb-4">
            <div>{reports.length} report(s)</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-panel text-main hover:bg-purple-700" onClick={() => setShowReports((s) => !s)}>
                {showReports ? "Hide" : "Show"}
              </button>
              <button className="px-3 py-1 rounded bg-panel text-main hover:bg-red-700" onClick={clearReports}>Clear</button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {reports.length === 0 && (
              <div className="p-8 text-center text-muted">No reports to show. Create one from the last comparison.</div>
            )}

            {reports.map((r) => (
              <article className="flex flex-col md:flex-row justify-between gap-4 p-6 rounded-xl bg-panel shadow panel-rounded" key={r.id}>
                <div className="flex-1">
                  <div className="font-bold text-lg text-purple-200">{r.title}</div>
                  <div className="text-xs text-muted mb-2">{new Date(r.createdAt).toLocaleString()}</div>
                  <div className="text-secondary text-sm">{r.summary}</div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button className="px-4 py-2 rounded bg-panel text-main hover:bg-purple-600" onClick={() => viewReport(r)}>View</button>
                  <button className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-800" onClick={() => downloadPdf(r)}>Download</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
