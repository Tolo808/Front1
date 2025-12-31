// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import Dashboard from "./components/OrdersDashboard.jsx";
import Statistics from "./components/Statistics.jsx";
import AdminChoice from "./components/AdminChoice.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Admin Specific Routes */}
        <Route path="/admin-choice" element={<AdminChoice />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/statistics" element={<Statistics />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;