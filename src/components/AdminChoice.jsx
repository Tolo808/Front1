// src/components/AdminChoice.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminChoice.css";

export default function AdminChoice() {
  const navigate = useNavigate();

  return (
    <div className="choice-wrapper">
      <div className="choice-card">
        <h1>Welcome, Admin! 👋</h1>
        <p>Please select a workspace to continue:</p>
        <div className="choice-btns">
          <button onClick={() => navigate("/admin-panel")} className="btn-panel">
            🛠 Admin Panel (Manage Drivers)
          </button>
          <button onClick={() => navigate("/statistics")} className="btn-stats">
            📊 Statistics & Reports
          </button>
        </div>
      </div>
    </div>
  );
}