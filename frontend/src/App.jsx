import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ModernHome from "./pages/ModernHome";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import Services from "./pages/Services";
import Legal from "./pages/Legal";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ModernHome />} />
        <Route path="/services" element={<Services />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
