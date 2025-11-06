// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

// apply saved theme quickly to avoid flash
const _initialTheme = (() => {
  try {
    return localStorage.getItem("docsync_theme") || "dark";
  } catch {
    return "dark";
  }
})();
document.documentElement.setAttribute("data-theme", _initialTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
