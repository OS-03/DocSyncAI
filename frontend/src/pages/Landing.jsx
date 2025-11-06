import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; 

// Import your images
import bgImage1 from '../assets/Image1.png'; // Full-page background

function App() {
  return (
    <div className="landing-page-hero">

      {/* --- FULL-PAGE BACKGROUND IMAGE --- */}
      <img src={bgImage1} alt="Background" className="bg-img" />
      <div className="bg-overlay"></div>

      {/* --- Content --- */}
      <div className="content-container"> 
        <h1 className="hero-title">
          <span className="purple-gradient">DocSyncAI</span>
        </h1> 
        <p className="hero-subtitle">
          Your ultimate solution for smart document management.
          <br />
          Experience the future of AI-powered insights.
        </p>

        <Link to="/home" className="get-started-button">
          Get Started <span className="arrow">&gt;</span>
        </Link>
      </div>

      {/* --- NEW: Background Images --- */}
      <img src={bgImage1} alt="Abstract UI card 1" className="bg-img" />
      <div className="bg-overlay"></div>

      {/* --- Floating Spheres --- */}
      <div className="bg-sphere sphere-one"></div>
      <div className="bg-sphere sphere-two"></div>
      <div className="bg-sphere sphere-three"></div>

      {/* --- Particles --- */}
      <div className="bg-particle particle-one"></div>
      <div className="bg-particle particle-two"></div>
      <div className="bg-particle particle-three"></div>

    </div>
  );
}

export default App;
