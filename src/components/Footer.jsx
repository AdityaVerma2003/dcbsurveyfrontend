import React from 'react'
import divyashDigital from '../assets/divyashDigital.jpeg';
import { NavLink } from 'react-router-dom'
const Footer = () => {
  return (
    <div className="mt-8 text-center text-white text-sm space-y-2 w-full p-6  h-32 bg-gradient-to-r from-gray-800 to-gray-900  overflow-hidden font-sans">
            <p>Cantonment Board Delhi, Sadar Bazar, Delhi Cantt, New Delhi, Delhi 110010, India</p>
            <p className="flex items-center justify-center space-x-2">
                <span>Designed By </span>
                <NavLink to="https://divyashdigital.co.in/"> <img src={divyashDigital} alt="Divyash Digital" className="w-8 h-8 rounded-full" /></NavLink>
                <NavLink to="https://divyashdigital.co.in/" className="font-semibold text-blue-300">Divyash Digital</NavLink>
            </p>
        </div>
  )
}

export default Footer