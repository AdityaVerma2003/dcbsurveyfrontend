import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Users, FileText, Search, Download, Eye, Calendar, MapPin, User, Building, LogOut, XCircle, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import SurveyorRegistrationForm from './SurveyorRegistration';

const AdminDashboard = ({ onLogout }) => {
  const [data, setData] = useState([]);
  const [surveyors, setSurveyors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null); // New state for modal details

  // --- Pagination state for Submissions ---
  const [submissionsCurrentPage, setSubmissionsCurrentPage] = useState(1);
  const submissionsItemsPerPage = 10;
  // --- Pagination state for Surveyors ---
  const [surveyorsCurrentPage, setSurveyorsCurrentPage] = useState(1);
  const surveyorsItemsPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch form submissions
        const loadingToast = toast.info("Fetching Location...", { autoClose: false });
        // NOTE: The URL below is a placeholder. You need to replace it with your actual backend URL.
        const formRes = await axios.get(`${API_BASE_URL}/api/form/data`);
        setData(formRes.data);
        setFilteredData(formRes.data);
        toast.dismiss(loadingToast);

        // Extract unique surveyors from form data
        const uniqueSurveyors = [...new Set(formRes.data.map(entry => entry.surveyorName))]
          .map(name => ({
            name,
            submissions: formRes.data.filter(entry => entry.surveyorName === name).length,
            lastSubmission: Math.max(...formRes.data
              .filter(entry => entry.surveyorName === name)
              .map(entry => new Date(entry.date).getTime()))
          }));
        setSurveyors(uniqueSurveyors);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Reset page to 1 whenever search term changes
    setSubmissionsCurrentPage(1);
    const filtered = data.filter(entry =>
      entry.surveyorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.occupiersName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  // --- Pagination Logic for Submissions ---
  const indexOfLastSubmission = submissionsCurrentPage * submissionsItemsPerPage;
  const indexOfFirstSubmission = indexOfLastSubmission - submissionsItemsPerPage;
  const currentSubmissions = filteredData.slice(indexOfFirstSubmission, indexOfLastSubmission);
  const totalSubmissionPages = Math.ceil(filteredData.length / submissionsItemsPerPage);

  const paginateSubmissions = (pageNumber) => setSubmissionsCurrentPage(pageNumber);

  // --- Pagination Logic for Surveyors ---
  const indexOfLastSurveyor = surveyorsCurrentPage * surveyorsItemsPerPage;
  const indexOfFirstSurveyor = indexOfLastSurveyor - surveyorsItemsPerPage;
  const currentSurveyors = surveyors.slice(indexOfFirstSurveyor, indexOfLastSurveyor);
  const totalSurveyorPages = Math.ceil(surveyors.length / surveyorsItemsPerPage);

  const paginateSurveyors = (pageNumber) => setSurveyorsCurrentPage(pageNumber);

  const downloadExcel = async () => {
    try {
      const loadingToast = toast.info("Generating and downloading Excel file...", { autoClose: false });
      const response = await axios.get(`${API_BASE_URL}/api/form/download-excel`, {
        responseType: 'blob', // Important to handle the binary file data
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `property_survey_${filteredData.length}_records_${currentDate}.xlsx`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success('Excel File Downloaded Successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

    } catch (err) {
      console.error('Error downloading Excel file:', err);
      toast.error('Failed to download Excel file. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  // Function to handle showing the details modal
  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
  };

  // Function to handle closing the details modal
  const handleCloseDetails = () => {
    setSelectedEntry(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <p className="text-red-600 font-semibold text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Delhi Cantonment Board 2025</h1>
            </div>
            <button
              onClick={() => onLogout()}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold mb-4">Welcome to the Property Tax Survey Portal</h2>
                <p className="text-blue-100 text-lg leading-relaxed">
                  You are now logged in to the Delhi Cantonment Property Tax Survey system.
                  Below, you can check the list of assigned surveyor details and track the forms submitted.
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Submissions"
                value={data.length}
                icon={FileText}
                color="#3B82F6"
              />
              <StatCard
                title="Active Surveyors"
                value={surveyors.length}
                icon={Users}
                color="#10B981"
              />
              <StatCard
                title="This Month"
                value={data.filter(entry => {
                  const entryDate = new Date(entry.date);
                  const now = new Date();
                  return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                }).length}
                icon={Calendar}
                color="#F59E0B"
              />
              <StatCard
                title="Properties Surveyed"
                value={data.length}
                icon={MapPin}
                color="#EF4444"
              />
            </div>

            {/* Action Buttons */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Button */}
              <button
                onClick={() => { setActiveView('surveyors'); setSurveyorsCurrentPage(1); }}
                className="group bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl p-8 text-left transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-lg mr-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">View Surveyor List</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Access the complete list of surveyors and their submission statistics.
                  Monitor surveyor performance and activity levels.
                </p>
                <div className="flex justify-center mt-4">
                  <div className="bg-blue-500 text-white rounded-lg px-6 py-2 text-center">View</div>
                </div>
              </button>

              {/* Second Button */}
              <button
                onClick={() => { setActiveView('submissions'); setSubmissionsCurrentPage(1); }}
                className="group bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 rounded-xl p-8 text-left transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-lg mr-4">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">View Submitted Forms</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Review all submitted property tax survey forms with advanced search,
                  filtering, and export capabilities.
                </p>
                <div className="flex justify-center mt-4">
                  <div className="bg-blue-500 text-white rounded-lg px-6 py-2 text-center">View</div>
                </div>
              </button>

              {/* Third Button → Full Width on Large Screens */}
              <button
                onClick={() => setActiveView('register')}
                className="group bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl p-8 text-left transition-all duration-200 transform hover:scale-105 lg:col-span-2"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-lg mr-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Register Surveyor</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Register new surveyors to the system. Ensure all surveyors are properly onboarded
                  and have access to the necessary tools and resources.
                </p>
                <div className="flex justify-center mt-4">
                   <div className="bg-blue-500 text-white rounded-lg px-6 py-2 text-center">Register</div>
                </div>
              </button>

            </div>

          </>
        )}

        {activeView === 'surveyors' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Surveyor List</h2>
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Active Surveyors ({surveyors.length})</h3>
              </div>

              {surveyors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No surveyors found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {currentSurveyors.map((surveyor, index) => (
                    <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-full mr-4">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{surveyor.name}</h4>
                            <p className="text-sm text-gray-600">
                              Last activity: {new Date(surveyor.lastSubmission).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {surveyor.submissions} submissions
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Surveyor Pagination Controls */}
              {totalSurveyorPages > 1 && (
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
                  <button
                    onClick={() => paginateSurveyors(surveyorsCurrentPage - 1)}
                    disabled={surveyorsCurrentPage === 1}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {surveyorsCurrentPage} of {totalSurveyorPages}
                  </span>
                  <button
                    onClick={() => paginateSurveyors(surveyorsCurrentPage + 1)}
                    disabled={surveyorsCurrentPage === totalSurveyorPages}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'submissions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Submitted Forms</h2>
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by surveyor, occupier, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadExcel}
                    disabled={filteredData.length === 0}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                Showing {indexOfFirstSubmission + 1} to {Math.min(indexOfLastSubmission, filteredData.length)} of {filteredData.length} submissions
              </p>
            </div>

            {/* Data Table */}
            {currentSubmissions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No form entries have been submitted yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surveyor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Occupier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentSubmissions.map((entry) => (
                        <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-1 bg-blue-100 rounded-full mr-3">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {entry.surveyorName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.occupiersName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {entry.propertyAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${entry.ownerOrTenant === 'Owner'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                              }`}>
                              {entry.ownerOrTenant}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(entry)}
                              className="flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submission Pagination Controls */}
                {totalSubmissionPages > 1 && (
                  <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
                    <button
                      onClick={() => paginateSubmissions(submissionsCurrentPage - 1)}
                      disabled={submissionsCurrentPage === 1}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {submissionsCurrentPage} of {totalSubmissionPages}
                    </span>
                    <button
                      onClick={() => paginateSubmissions(submissionsCurrentPage + 1)}
                      disabled={submissionsCurrentPage === totalSubmissionPages}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeView === 'register' && (
        <SurveyorRegistrationForm setActiveView={setActiveView} />
      )}
      </div>

      {/* Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseDetails}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
              Submission Details
            </h2>

            {/* Main Content Grid */}
            <div className="grid gap-8">
              {/* Left Column - Information */}
              <div className="space-y-6">
                {/* Surveyor Info Section */}
                <div>
                  <h3 className="flex items-center text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                    <User className="w-5 h-5 text-blue-600 mr-2" /> Surveyor Info
                  </h3>
                  <div className="space-y-3 text-gray-600">
                    <p><strong>Name:</strong> {selectedEntry.surveyorName}</p>
                    <p><strong>Phone:</strong> {selectedEntry.phone}</p>
                    <p><strong>Date:</strong> {new Date(selectedEntry.date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Occupier Info Section */}
                <div>
                  <h3 className="flex items-center text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                    <Users className="w-5 h-5 text-blue-600 mr-2" /> Occupier Info
                  </h3>
                  <div className="space-y-3 text-gray-600">
                    <p><strong>Name:</strong> {selectedEntry.occupiersName}</p>
                    <p><strong>Gender:</strong> {selectedEntry.gender}</p>
                    <p><strong>Father's Name:</strong> {selectedEntry.fatherName}</p>
                    <p><strong>Mother's Name:</strong> {selectedEntry.motherName}</p>
                    <p><strong>Contact:</strong> {selectedEntry.contactNumber}</p>
                  </div>
                </div>

                {/* Property Info Section */}
                <div>
                  <h3 className="flex items-center text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                    <Building className="w-5 h-5 text-blue-600 mr-2" /> Property Info
                  </h3>
                  <div className="space-y-3 text-gray-600">
                    <p><strong>Address:</strong> {selectedEntry.propertyAddress}</p>
                    <p><strong>ZIP Code:</strong> {selectedEntry.zipCode}</p>
                    <p><strong>Ward No:</strong> {selectedEntry.wardNo}</p>
                    <p><strong>Property Status:</strong> {selectedEntry.ownerOrTenant}</p>
                    <p><strong>Area of Plot:</strong> {selectedEntry.areaOfPlot}</p>
                    <p><strong>Nature of Building:</strong> {selectedEntry.natureOfBuilding}</p>
                    <p><strong>Number of Floors:</strong> {Array.isArray(selectedEntry.numberOfFloors) ? selectedEntry.numberOfFloors.join(', ') : selectedEntry.numberOfFloors}</p>
                    <p><strong>Floor Area:</strong> {selectedEntry.floorArea}</p>
                    <p><strong>Usage Type:</strong> {selectedEntry.usageType}</p>
                    <p><strong>Coordinates:</strong> {selectedEntry.latitude}, {selectedEntry.longitude}</p>
                  </div>
                </div>

                {/* Tenant Details (if applicable) */}
                {selectedEntry.ownerOrTenant === 'Tenant' && (
                  <div>
                    <h3 className="flex items-center text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                      <User className="w-5 h-5 text-blue-600 mr-2" /> Tenant Info
                    </h3>
                    <div className="space-y-3 text-gray-600">
                      <p><strong>Tenant Name:</strong> {selectedEntry.tenantDetails?.ownerName}</p>
                      <p><strong>Father's Name:</strong> {selectedEntry.tenantDetails?.ownerFatherName}</p>
                      <p><strong>Mother's Name:</strong> {selectedEntry.tenantDetails?.ownerMotherName}</p>
                      <p><strong>Contact:</strong> {selectedEntry.tenantDetails?.ownerContactNumber}</p>
                      <p><strong>Rent:</strong> ₹ {selectedEntry.tenantDetails?.monthlyRent}</p>
                      <p><strong>Address:</strong> {selectedEntry.tenantDetails?.streetAddress}</p>
                      <p><strong>ZIP Code:</strong> {selectedEntry.tenantDetails?.zipCode}</p>
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AdminDashboard;