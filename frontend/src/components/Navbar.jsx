import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // theme: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("docsync_theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("docsync_theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <header className="top-nav">
      <div className="brand">
        <Link to="/" className="brand-link">
          DocSyncAI
        </Link>
      </div>

      <nav className="nav-links" aria-label="Main navigation">
        <Link to="/home" className={`nav-link ${isActive("/home") ? "active" : ""}`} aria-current={isActive("/home") ? "page" : undefined}>
          Home
        </Link>
        <Link to="/compare" className={`nav-link ${isActive("/compare") ? "active" : ""}`} aria-current={isActive("/compare") ? "page" : undefined}>
          Compare
        </Link>
        <Link to="/reports" className={`nav-link ${isActive("/reports") ? "active" : ""}`} aria-current={isActive("/reports") ? "page" : undefined}>
          Reports
        </Link>
      </nav>

      <div className="nav-actions">
        {/* theme toggle */}
        <button
          title="Toggle theme"
          onClick={toggleTheme}
          className="btn small ghost theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        {user ? (
          <>
            <span className="user-email">{user.email}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link to="/login" className="btn small ghost">
              Log In
            </Link>
            <Link to="/signup" className="btn small primary">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
