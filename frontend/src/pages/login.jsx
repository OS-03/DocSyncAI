import React, { useState, useContext } from "react";
import { account } from "../appwriteConfig";
import { OAuthProvider } from "appwrite";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await account.createEmailPasswordSession(email, password);
      await refreshUser();
      navigate("/home");
    } catch (error) {
      alert(error.message || "Login failed");
    }
  };

  const handleGithubLogin = () => {
    account.createOAuth2Session(OAuthProvider.Github, "http://localhost:5173/");
  };

  const handleGoogleLogin = () => {
    account.createOAuth2Session(OAuthProvider.Google, "http://localhost:5173/");
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
          <div className="text-3xl font-bold text-purple-300 mb-2">{`</>`}</div>
          <h1 className="text-lg font-semibold">
            Welcome to{" "}
            <span className="text-purple-400 font-bold">DocSyncAI</span>
          </h1>
        </div>

        <button
          className="w-full py-3 rounded-lg bg-purple-700 text-white font-semibold mb-3 flex items-center justify-center gap-2 hover:bg-purple-800"
          onClick={handleGithubLogin}
        >
          <i className="fa-brands fa-github"></i> Continue with GitHub
        </button>

        <button
          className="w-full py-3 rounded-lg bg-white text-black font-semibold mb-3 flex items-center justify-center gap-2 hover:bg-slate-200"
          onClick={handleGoogleLogin}
        >
          <i className="fa-brands fa-google"></i> Continue with Google
        </button>

        <form onSubmit={handleLogin} className="mt-4">
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full py-2 px-3 rounded-lg bg-slate-700 text-white mb-4"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-800"
          >
            Continue with Email
          </button>
        </form>

        <p className="mt-4 text-slate-400">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-purple-400 font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
