import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

// This component is now a dedicated Login page. The Register and navigation
// components have been removed for a streamlined experience.
const AuthPages = () => {
  // State for form data and UI feedback
     const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // for success/error messages

  // The previous error related to 'import.meta.env' has been fixed.
  // We'll use a placeholder for the API base URL to ensure the code runs without a build configuration error.
    const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  // This useEffect hook checks for an existing token on component mount
  // and redirects the user if they are already logged in.
 useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
      if (isAdmin) {
        navigate("/admin-dashboard");
      } 
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear the specific error for this field as the user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Helper function to validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if(res.ok) {
        // Set a default value for isAdmin if it's not present in the user data
        const isAdmin = data.user.role === "admin";
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.user.username);
        localStorage.setItem("isAdmin", isAdmin.toString());

        setMessage({ type: 'success', text: "Login successful! Redirecting..." });

        if (isAdmin) {
          navigate("/admin-dashboard");
        } else {
          navigate("/instructions");
        }

      } else {
        setMessage({ type: 'error', text: data.message || "Login failed. Please check your credentials." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Login failed. Please check your credentials." });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative min-h-screen flex items-center justify-center p-6 font-sans">
      <style>{`
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Removed the navigation buttons and wrapped the login form directly */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Login</h3>
              <p className="text-gray-600">Registered User Only!</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Username</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-gray-50 focus:bg-white ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your username"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-11 pr-11 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-gray-50 focus:bg-white ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
          
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Logging In...' : 'Login'}
              </button>
            </form>
          </div>
          {message.text && (
            <div className={`p-4 mx-8 my-4 rounded-xl flex items-center space-x-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
