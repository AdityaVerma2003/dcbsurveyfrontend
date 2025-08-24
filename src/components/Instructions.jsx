import React from 'react';
import { useNavigate } from 'react-router-dom';

const Instructions = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-6">Welcome To Delhi Cantonment Board Survey</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
       Surveyors will visit households in Delhi Cantonment to collect property details and fill forms for the Property Tax Survey.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">Instructions to Fill the Form</h3>
        <ul className="list-disc list-inside text-left text-gray-700 space-y-3">
          <li>Before the form opens, a pop-up will appear requesting your current location. Please grant this permission.</li>
          <li>Keep your property documents (ownership proof, previous tax receipts) ready.</li>
          <li> Enter your personal and property details as required in the form.</li>
          <li>All fields marked with an asterisk (*) are mandatory. Please ensure you fill them out accurately.</li>
          <li>Once all fields are filled and validated, you can click "Submit" to complete the survey.</li>
        </ul>
      </div>

      <button
        onClick={() => navigate('/form')}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
      >
        Proceed to Form
      </button>
       <button
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
      >
        Logout
      </button>
    </div>
  );
};

export default Instructions;