import React from "react";
import "./WelcomePage.css";
import logo from "../../assets/logo.png"; // Logo
import background from "../../assets/background.png"; // Background Image

const WelcomePage = () => {
  return (
    <div className="welcome-container">
      {/* Background Image */}
      <div className="background-image" style={{ backgroundImage: `url(${background})` }}></div>

      {/* Blur Overlay */}
      <div className="background-overlay"></div>

      

      {/* Welcome Content */}
      <div className="welcome-box">
        <img src={logo} alt="Logo" className="logo-img" /> {/* Logo Inside the Welcome Box */}
        <h1 className="welcome-title">Welcome to RAM Medical</h1>
        <p className="welcome-text">
          Embark on a journey toward better health and wellness. Here, you'll
          find the support, resources, and community you need.
        </p>

        <div className="quote-box">
          <p>"Wherever the art of medicine is loved, there is also a love of humanity." – Hippocrates</p>
        </div>

        <button className="get-started-btn" onClick={() => window.location.href = "/login"}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
