// App.jsx
import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";

import Home from "./pages/Homepage.jsx";
import Compare from "./pages/compare.jsx";
import Reports from "./pages/report.jsx";
import Login from "./pages/login.jsx";
import Landing from "./pages/Landing.jsx";
import Signup from "./pages/signup.jsx";
import Navbar from "./components/Navbar";

function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/compare" element={<Compare />} />
  <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
