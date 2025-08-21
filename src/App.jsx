import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';


import Instructions from './components/Instructions';
import Form from './components/Form';
import AdminDashboard from './components/AdminDashboard';
import axios from 'axios';
import AuthPages from './components/AuthPages';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute'; // <-- 1. Import the new component

// Main App component with routing
function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('isAdmin');
    if (token) {
      setIsAuth(true);
      setIsAdmin(role === 'true');
    }
  }, []);

 
  const handleLogout = () => {  
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('name'); // Clear the name from localStorage
    setIsAuth(false);
    setIsAdmin(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen overflow-auto">
    
      <div className="w-full rounded-xl shadow-2xl p-2">
        <Header />
        <Routes>
          <Route path="/auth" element={<AuthPages  />} /> {/* <-- Pass handleLogin to AuthPages */}
          <Route path="/instructions" element={ <Instructions /> } />
          <Route path="/form" element={<Form onLogout={handleLogout} />} />
          {/* 2. Wrap the AdminDashboard route with the new ProtectedRoute component */}
          <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard  onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="*" element={<AuthPages  />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;
