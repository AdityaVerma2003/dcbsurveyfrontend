import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Eye, EyeOff, UserPlus, LogIn, Home, Shield, XCircle, CheckCircle } from 'lucide-react';


// The main authentication component
const AuthPages = () => {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'register', or 'forgotPassword'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    // 'keepSignedIn' is handled implicitly by the token persistence, but we keep the checkbox for user feedback.
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // for success/error messages

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;


  // This useEffect hook runs once on component mount to check for an existing token
  // and redirect the user if they're already logged in.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // In a real application, you would also validate this token with your backend.
      // For this example, we assume it's valid and redirect.
      // For the purpose of this demo, we'll just log it.
      // In a real app, this would be: window.location.href = "/form";
      setMessage({ type: 'success', text: 'You are already logged in!' });
      window.location.href = "/form";
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear the specific error for this field as the user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Helper function to validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (currentPage === 'login') {
      if (!formData.username) newErrors.username = "Username is required.";
      if (!formData.password) newErrors.password = "Password is required.";
    } else if (currentPage === 'register') {
      if (!formData.username) newErrors.username = "Username is required.";
      if (!formData.email) {
        newErrors.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email address is invalid.";
      }
      if (!formData.password) {
        newErrors.password = "Password is required.";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters.";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required.";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    
    }
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
      if(data.user.role==="admin"){
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", "true");
        setMessage({ type: 'success', text: "Login successful! Redirecting..." });
        window.location.href = "/admin-dashboard";
      }
      else if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", "false");
        setMessage({ type: 'success', text: "Login successful! Redirecting..." });
        window.location.href = "/instructions";

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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: "Registration successful! You can now log in." });
        setCurrentPage("login");
      } else {
        setMessage({ type: 'error', text: data.message || "Registration failed. Username or email may already be in use." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Registration failed. Server error." });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setMessage({ type: 'success', text: "You have been logged out." });
    setCurrentPage('login');
  };

  // Render the current page based on state
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h3>
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
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="keepSignedIn"
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">Keep me signed in</span>
                </label>
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
        );
      case 'register':
        return (
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h3>
              <p className="text-gray-600">Join us to access the survey portal</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-5">
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
                    placeholder="Choose a username"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-gray-50 focus:bg-white ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
                    placeholder="Create a password"
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Confirm Password</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-11 pr-11 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-gray-50 focus:bg-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Confirm your password"
                  />
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-1"
                />
                <label className="text-sm text-gray-700">
                  I agree to the <a href="#" className="text-green-600 hover:text-green-700 font-medium">Terms of Service</a> and <a href="#" className="text-green-600 hover:text-green-700 font-medium">Privacy Policy</a>
                </label>
              </div>
              {errors.agreeTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeTerms}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        );
  
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative overflow-hidden font-sans">
      <style>{`
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
      
      <div className=" flex flex-col items-center justify-center p-6 ">
        
        <div className="w-full max-w-md">
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-1">
                <div className="flex rounded-xl bg-white">
                  <button
                    onClick={() => { setCurrentPage('login'); setErrors({}); setMessage({ type: '', text: '' }); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      currentPage === 'login'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => { setCurrentPage('register'); setErrors({}); setMessage({ type: '', text: '' }); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      currentPage === 'register'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register</span>
                  </button>
                </div>
              </div>
            {renderPage()}
            {message.text && (
              <div className={`p-4 mx-8 my-4 rounded-xl flex items-center space-x-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}
          </div>
          {currentPage === 'loggedIn' && (
            <div className="mt-8 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">You're All Set!</h3>
              <p className="text-gray-600 mb-6">You're currently logged in. You can navigate away and return without re-entering your credentials.</p>
              <button onClick={handleLogout} className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 transition-all duration-300">
                Logout
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default AuthPages;
