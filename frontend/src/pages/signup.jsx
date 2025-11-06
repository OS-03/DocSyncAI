// src/pages/Signup.jsx
import React, { useState } from "react";
import { account } from "../appwriteConfig";
import { ID } from "appwrite";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Create a new Appwrite account
      await account.create(ID.unique(), email, password, name);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  // Theme-based colors
  const theme = document.documentElement.dataset.theme || "dark";
  const bg =
    theme === "light"
      ? "bg-slate-100 text-slate-900"
      : "bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100";

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${bg} font-sans`}
    >
      <div className="bg-slate-800 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="text-3xl font-bold text-purple-300 mb-2">
            DocSyncAI
          </div>
          <h1 className="text-lg font-semibold">
            Create{" "}
            <span className="text-purple-400 font-bold">Your Account</span>
          </h1>
        </div>

        <form className="mt-4" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full py-2 px-3 rounded-lg bg-slate-700 text-white mb-2"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full py-2 px-3 rounded-lg bg-slate-700 text-white mb-2"
          />
          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full py-2 px-3 rounded-lg bg-slate-700 text-white mb-4"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-800"
          >
            Sign Up
          </button>
        </form>

        {error && <p className="text-red-400 mt-2">{error}</p>}
        {success && <p className="text-green-400 mt-2">{success}</p>}

        <p className="mt-4 text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-purple-400 font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
