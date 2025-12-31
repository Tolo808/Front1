// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    role: "call-center", // Default role
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };


const handleLogin = (e) => {
  e.preventDefault();
  const { username, password, role } = credentials;

  // Validation for Admin
  if (role === "admin" && username === "admin" && password === "admin123") {
    navigate("/admin-choice");
  } 
  // Validation for Call Center
  else if (role === "call-center" && username === "call" && password === "call123") {
    navigate("/dashboard");
  } 
  // Handle Incorrect Credentials
  else {
    alert("Invalid credentials for the selected role. Please try again.");
  }
};

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Tolo Delivery Login</h2>
        
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
        />

        <label>Role</label>
        <select name="role" value={credentials.role} onChange={handleChange}>
          <option value="call-center">Call Center</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" className="login-btn">Login</button>
      </form>
    </div>
  );
}
