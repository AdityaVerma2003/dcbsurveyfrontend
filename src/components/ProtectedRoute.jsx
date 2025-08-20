import React, { useEffect } from 'react'; // <-- 1. Import useEffect
import { useNavigate } from 'react-router-dom';

/**
 * A component to protect routes based on authentication and role.
 * It checks localStorage for a token and an 'isAdmin' flag.
 * If the conditions are not met, it redirects the user to the login page.
 * * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child components to render if authorized.
 * @returns {React.ReactNode} - The child components or a redirect.
 */
const ProtectedRoute = ({ children }) => {
  // Use the useNavigate hook to redirect the user
  const navigate = useNavigate();

  // Retrieve the token and isAdmin status from localStorage
  const token = localStorage.getItem('token');
  // localStorage stores everything as a string, so we must check for the string 'true'
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // 2. Wrap the navigation logic in a useEffect hook
  useEffect(() => {
    // Check if a token exists and the user is an admin
    if (!token) {
      // If no token, redirect to the auth page
      navigate('/auth');
    } 
    
    if (token && !isAdmin) { // <-- 3. Add a check for when the token exists but the user is not an admin
      // If a token exists but the user is not an admin, redirect to a different page, like instructions
      navigate('/instructions');
    }
  }, [token, isAdmin, navigate]); // <-- Add dependencies to the array

  // If the user has a token and is an admin, allow them to see the route
  if (token && isAdmin) {
    return children;
  }

  // We return null to prevent rendering the child components while the navigation is happening
  return null;
};

export default ProtectedRoute;
