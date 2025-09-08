import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Form component with pagination and validation
const App = ({ onLogout }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        surveyorName: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        wardNo: '',
        propertyAddress: '',
        zipCode: '',
        latitude: null,
        longitude: null,
        occupiersName: '',
        gender: '',
        fatherName: '',
        motherName: '',
        contactNumber: '',
        ownerOrTenant: 'Owner',
        tenantDetails: {
            monthlyRent: '',
            ownerName: '',
            ownerFatherName: '',
            ownerMotherName: '',
            ownerContactNumber: '',
            streetAddress: '',
            zipCode: '',
        },
        areaOfPlot: '',
        natureOfBuilding: '',
        numberOfFloors: '', // Changed from array to string
        floorArea: '',
        usageType: '',
        mainGatePhoto: null,
        buildingPhoto: null,
        mainGatePhotoBase64: '',
        buildingPhotoBase64: '',
        floor: '', // Changed from array to string
    });
    const [loading, setLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Camera states
    const [showCamera, setShowCamera] = useState(false);
    const [currentPhotoType, setCurrentPhotoType] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

    // Convert file to base64
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Camera functions
    const startCamera = async (photoType) => {
        setCurrentPhotoType(photoType);
        setShowCamera(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('Could not access camera. Please upload from device.');
            setShowCamera(false);
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob], `${currentPhotoType}.jpg`, { type: 'image/jpeg' });
                handleCapturedPhoto(file);
            }, 'image/jpeg', 0.8);
        }
    };

 const handleCapturedPhoto = async (file) => {
    try {
        const base64 = await convertToBase64(file);

        if (currentPhotoType === "mainGate") {
            setFormData({
                ...formData,
                mainGatePhoto: file,
                mainGatePhotoBase64: base64,
            });

            // ✅ Also update hidden input so HTML5 validation passes
            const input = document.getElementById("mainGatePhoto");
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
            }
        } else if (currentPhotoType === "building") {
            setFormData({
                ...formData,
                buildingPhoto: file,
                buildingPhotoBase64: base64,
            });

            // ✅ Also update hidden input
            const input = document.getElementById("buildingPhoto");
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
            }
        }

        toast.success("Photo captured successfully!");
        stopCamera();
    } catch (error) {
        console.error("Error processing captured photo:", error);
        toast.error("Error processing photo");
    }
};


    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        setShowCamera(false);
        setCurrentPhotoType('');
    };


  
    // Handle location and autofill on component load
    useEffect(() => {
        async function fetchData() {
            const name = localStorage.getItem("name");
            if (name) {
                const res = await axios.get(`${API_BASE_URL}/api/auth/profile/${name}`);
                if (res.data.user) {
                    setFormData((prevData) => ({ ...prevData, surveyorName: res.data.user.name, phone: res.data.user.phone }));
                }
            }
        }
        fetchData();
    }, [step]);

    useEffect(() => {
        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        setFormData((prevData) => ({ ...prevData, latitude, longitude }));
                        setLocationError('');

                        try {
                            const loadingToast = toast.info("Fetching Location...", { autoClose: false });
                            const res = await axios.get(
                                `${API_BASE_URL}/api/geocode?lat=${latitude}&lng=${longitude}`
                            );

                            if (res.data.status === 'OK' && res.data.results.length > 0) {
                                const result = res.data.results[0];
                                const formattedAddress = result.formatted_address;
                                let zipCode = '';

                                const postcodeComponent = result.address_components.find(
                                    (component) => component.types.includes('postal_code')
                                );

                                if (postcodeComponent) {
                                    zipCode = postcodeComponent.long_name;
                                }

                                setFormData((prevData) => ({
                                    ...prevData,
                                    propertyAddress: formattedAddress,
                                    zipCode: zipCode,
                                }));
                            } else {
                                throw new Error('No results found.');
                            }

                            toast.dismiss(loadingToast);
                        } catch (err) {
                            setLocationError('Could not fetch address details. Please enter manually.');

                        }
                    },
                    (error) => {
                        setLocationError('Location permission denied. Please enter address manually.');
                    }
                );
            } else {
                setLocationError('Geolocation is not supported by this browser.');
            }
        };

        if (step === 1) {
            const userConfirmed = window.confirm('Please allow location access to auto-populate address fields.');
            if (userConfirmed) {
                getLocation();
            } else {
                setLocationError('Location access denied by user.');
            }
        }
    }, [step]);

    // Validation logic
    const validate = () => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.surveyorName.trim()) newErrors.surveyorName = 'Surveyor Name is required.';
            if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be a 10-digit number.';
            if (!formData.wardNo.trim()) newErrors.wardNo = 'Ward No is required.';
            if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Property Address is required.';
            if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP/Postal Code is required.';
        } else if (step === 2) {
            if (!formData.occupiersName.trim()) newErrors.occupiersName = 'Occupier\'s Name is required.';
            if (!formData.gender) newErrors.gender = 'Gender is required.';
            if (!formData.fatherName.trim()) newErrors.fatherName = 'Father\'s Name is required.';
            if (!formData.motherName.trim()) newErrors.motherName = 'Mother\'s Name is required.';
            if (!formData.contactNumber || !/^\d{10}$/.test(formData.contactNumber)) newErrors.contactNumber = 'Contact Number must be a 10-digit number.';
            if (formData.ownerOrTenant === 'Tenant') {
                if (!formData.tenantDetails.monthlyRent || isNaN(formData.tenantDetails.monthlyRent)) newErrors.monthlyRent = 'Monthly Rent is required and must be a number.';
                if (!formData.tenantDetails.ownerName.trim()) newErrors.ownerName = 'Owner Name is required.';
                if (!formData.tenantDetails.ownerFatherName.trim()) newErrors.ownerFatherName = 'Owner\'s Father\'s Name is required.';
                if (!formData.tenantDetails.ownerMotherName.trim()) newErrors.ownerMotherName = 'Owner\'s Mother\'s Name is required.';
                if (!formData.tenantDetails.ownerContactNumber || !/^\d{10}$/.test(formData.tenantDetails.ownerContactNumber)) newErrors.ownerContactNumber = 'Owner\'s Contact Number must be a 10-digit number.';
                if (!formData.tenantDetails.streetAddress.trim()) newErrors.streetAddress = 'Street Address is required.';
                if (!formData.tenantDetails.zipCode.trim()) newErrors.tenantZipCode = 'Owner\'s ZIP/Postal Code is required.';
            }
        } else if (step === 3) {
            if (!formData.areaOfPlot || isNaN(formData.areaOfPlot)) newErrors.areaOfPlot = 'Area of Plot is required and must be a number.';
            if (!formData.natureOfBuilding) newErrors.natureOfBuilding = 'Nature of Building is required.';
            if (!formData.numberOfFloors) newErrors.numberOfFloors = 'Number of floors must be selected.';
            if (!formData.floorArea || isNaN(formData.floorArea)) newErrors.floorArea = 'Floor Area is required and must be a number.';
            if (!formData.usageType) newErrors.usageType = 'Usage Type is required.';
        } else if (step === 4) {
            if (!formData.mainGatePhotoBase64) newErrors.mainGatePhoto = 'Main Gate photo is required.';
            if (!formData.buildingPhotoBase64) newErrors.buildingPhoto = 'Building photo is required.';
            if (!formData.floor) newErrors.floor = 'Floor must be selected.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('tenantDetails.')) {
            // Handle nested tenantDetails object
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                tenantDetails: { ...formData.tenantDetails, [field]: value },
            });
        }
        else {
            // Handle all other inputs (including the new dropdown fields)
            setFormData({ ...formData, [name]: value });
        }
    };


    const handleFileChange = async (e) => {
        const { name, files } = e.target;
        const file = files[0];

        if (file) {
            try {
                const base64 = await convertToBase64(file);
                if (name === 'mainGatePhoto') {
                    setFormData({
                        ...formData,
                        mainGatePhoto: file,
                        mainGatePhotoBase64: base64
                    });
                } else if (name === 'buildingPhoto') {
                    setFormData({
                        ...formData,
                        buildingPhoto: file,
                        buildingPhotoBase64: base64
                    });
                }
                toast.success('Image Uploaded successfully!');
            } catch (error) {
                console.error('Error Uploading image:', error);
                toast.error('Error processing image');
            }
        }
    };

    const handleNext = () => {
        if (validate()) {
            setStep(step + 1);
        }
    };

    const handlePrevious = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            setLoading(true);

            try {
                const submissionData = {
                    ...formData,
                    mainGatePhoto: formData.mainGatePhotoBase64,
                    buildingPhoto: formData.buildingPhotoBase64,
                };

                const loadingToast = toast.info("Uploading...", { autoClose: false });

                const res = await axios.post(`${API_BASE_URL}/api/form/submit`, submissionData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                toast.dismiss(loadingToast);
                if (res.status === 200) {
                    toast.success('Upload successful!', {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }

                setIsSubmitted(true);
            } catch (error) {
                toast.error(`Upload failed: ${error.response?.data?.error || 'Server error'}`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmitAnother = () => {
        // Reset all form data and state

        setFormData({
            date: new Date().toISOString().split('T')[0],
            wardNo: '',
            propertyAddress: '',
            zipCode: '',
            latitude: null,
            longitude: null,
            occupiersName: '',
            gender: '',
            fatherName: '',
            motherName: '',
            contactNumber: '',
            ownerOrTenant: 'Owner',
            tenantDetails: {
                monthlyRent: '',
                ownerName: '',
                ownerFatherName: '',
                ownerMotherName: '',
                ownerContactNumber: '',
                streetAddress: '',
                zipCode: '',
            },
            areaOfPlot: '',
            natureOfBuilding: '',
            numberOfFloors: '', // Reset to empty string
            floorArea: '',
            usageType: '',
            mainGatePhoto: null,
            buildingPhoto: null,
            mainGatePhotoBase64: '',
            buildingPhotoBase64: '',
            floor: '', // Reset to empty string
        });
        setStep(1);
        setIsSubmitted(false);
        setErrors({});
        setLocationError('');
    };

    const renderFormStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Step 1: Basic Information</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Surveyor Name *</label>
                                <input type="text" name="surveyorName" value={formData.surveyorName} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" readOnly required />
                                {errors.surveyorName && <p className="text-red-500 text-xs mt-1">{errors.surveyorName}</p>}
                            </div>
                            <div>
                                <label htmlFor='phone' className="block text-gray-700 font-bold mb-2">Phone *</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-0 pl-3 flex items-center pointer-events-none h-10 border pr-2 rounded-l-lg bg-gray-100">
                                        <span className="text-gray-500 text-sm mr-1">+91</span>
                                        <img src="https://flagcdn.com/in.svg" alt="Indian Flag" className="w-6 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id='phone'
                                        value={formData.phone}
                                        readOnly
                                        className="w-full pl-24 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                        pattern="[0-9]{10}"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" readOnly />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Ward No *</label>
                                <select name="wardNo" value={formData.wardNo} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required>
                                    <option value="">Select Ward No</option>
                                    {[...Array(8).keys()].map(i => (
                                        <option key={i + 1} value={i + 1}> {i + 1}</option>
                                    ))}
                                </select>
                                {errors.wardNo && <p className="text-red-500 text-xs mt-1">{errors.wardNo}</p>}
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-gray-700 font-bold mb-2">Property Address *</label>
                            <textarea name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required />
                            {errors.propertyAddress && <p className="text-red-500 text-xs mt-1">{errors.propertyAddress}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.latitude && formData.longitude && `Latitude: ${formData.latitude.toFixed(6)}, Longitude: ${formData.longitude.toFixed(6)}`}
                                {locationError && <span className="text-red-500 block">{locationError}</span>}
                            </p>
                        </div>
                        <div className="mt-4">
                            <label className="block text-gray-700 font-bold mb-2">ZIP/Postal Code *</label>
                            <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" readOnly={formData.zipCode !== ''} required />
                            {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Step 2: Occupier Details</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Occupier's Name *</label>
                                <input type="text" name="occupiersName" value={formData.occupiersName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" onKeyDown={(e) => {
                                    // Check if the key pressed is a number (0-9)
                                    // You can also check for numpad numbers
                                    if (/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }} required />
                                {errors.occupiersName && <p className="text-red-500 text-xs mt-1">{errors.occupiersName}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Father / Spouse Name *</label>
                                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required onKeyDown={(e) => {
                                    // Check if the key pressed is a number (0-9)
                                    // You can also check for numpad numbers
                                    if (/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }} />
                                {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Mother's Name* </label>
                                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" onKeyDown={(e) => {
                                    // Check if the key pressed is a number (0-9)
                                    // You can also check for numpad numbers
                                    if (/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }} />
                                {errors.motherName && <p className="text-red-500 text-xs mt-1">{errors.motherName}</p>}
                            </div>
                            <div>
                                <label htmlFor="contactNumber" className="block text-gray-700 font-bold mb-2">Contact Number *</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-0 pl-3 flex items-center pointer-events-none h-10 border pr-2 rounded-l-lg bg-gray-100">
                                        <span className="text-gray-500 text-sm mr-1">+91</span>
                                        <img src="https://flagcdn.com/in.svg" alt="Indian Flag" className="w-6 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        id="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="w-full pl-24 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                        pattern="[0-9]{10}"
                                    />
                                    {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Whether Owner or Tenant *</label>
                                <select name="ownerOrTenant" value={formData.ownerOrTenant} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required>
                                    <option value="Owner">Owner</option>
                                    <option value="Tenant">Tenant</option>
                                </select>
                            </div>
                        </div>
                        {formData.ownerOrTenant === 'Tenant' && (
                            <div className="mt-8 bg-green-50 p-6 rounded-lg border border-green-200">

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Monthly Rent *</label>
                                        <input type="number" min="0" name="tenantDetails.monthlyRent" value={formData.tenantDetails.monthlyRent} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required />
                                        {errors.monthlyRent && <p className="text-red-500 text-xs mt-1">{errors.monthlyRent}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Name *</label>
                                        <input type="text" name="tenantDetails.ownerName" value={formData.tenantDetails.ownerName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required onKeyDown={(e) => {
                                            // Check if the key pressed is a number (0-9)
                                            // You can also check for numpad numbers
                                            if (/[0-9]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }} />
                                        {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Father / Spouse Name *</label>
                                        <input type="text" name="tenantDetails.ownerFatherName" value={formData.tenantDetails.ownerFatherName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required onKeyDown={(e) => {
                                            // Check if the key pressed is a number (0-9)
                                            // You can also check for numpad numbers
                                            if (/[0-9]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }} />
                                        {errors.ownerFatherName && <p className="text-red-500 text-xs mt-1">{errors.ownerFatherName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Mother's Name *</label>
                                        <input type="text" name="tenantDetails.ownerMotherName" value={formData.tenantDetails.ownerMotherName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required onKeyDown={(e) => {
                                            // Check if the key pressed is a number (0-9)
                                            // You can also check for numpad numbers
                                            if (/[0-9]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }} />
                                        {errors.ownerMotherName && <p className="text-red-500 text-xs mt-1">{errors.ownerMotherName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Contact Number *</label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-0 pl-3 flex items-center pointer-events-none h-10 border pr-2 rounded-l-lg bg-gray-100">
                                                <span className="text-gray-500 text-sm mr-1">+91</span>
                                                <img src="https://flagcdn.com/in.svg" alt="Indian Flag" className="w-6 h-4" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="tenantDetails.ownerContactNumber"
                                                value={formData.tenantDetails.ownerContactNumber}
                                                onChange={handleChange}
                                                className="w-full pl-24 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                required
                                                pattern="[0-9]{10}"
                                            />
                                            {errors.ownerContactNumber && <p className="text-red-500 text-xs mt-1">{errors.ownerContactNumber}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Street Address *</label>
                                        <textarea name="tenantDetails.streetAddress" value={formData.tenantDetails.streetAddress} onChange={handleChange} rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required></textarea>
                                        {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">ZIP/Postal Code *</label>
                                        <input type="number" min="0" name="tenantDetails.zipCode" value={formData.tenantDetails.zipCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" required />
                                        {errors.tenantZipCode && <p className="text-red-500 text-xs mt-1">{errors.tenantZipCode}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                );
            case 3:
                return (
                    <>
                        <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Step 3: Property Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Area of Plot field */}
                            <div className="flex flex-col">
                                <label className="block text-gray-700 font-bold mb-2">Area of Plot (sq ft) *</label>
                                <input
                                    type="number"
                                    name="areaOfPlot"
                                    min="0"
                                    value={formData.areaOfPlot}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                    required
                                />
                                {errors.areaOfPlot && <p className="text-red-500 text-sm mt-1">{errors.areaOfPlot}</p>}
                            </div>

                            {/* Nature of Building field */}
                            <div className="flex flex-col">
                                <label className="block text-gray-700 font-bold mb-2">Nature of Building *</label>
                                <select
                                    name="natureOfBuilding"
                                    value={formData.natureOfBuilding}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="Flat">Flat</option>
                                    <option value="Part of Building">Part of Building</option>
                                    <option value="Independent Building">Independent Building</option>
                                    <option value="Vacant Land">Vacant Land</option>
                                </select>
                                {errors.natureOfBuilding && <p className="text-red-500 text-sm mt-1">{errors.natureOfBuilding}</p>}
                            </div>

                            {/* Number of Floors dropdown field */}
                            <div className="flex flex-col">
                                <label className="block text-gray-700 font-bold mb-2">Number of floors *</label>
                                <select
                                    name="numberOfFloors"
                                    value={formData.numberOfFloors}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                    required
                                >
                                    <option value="">Select Number of Floors</option>
                                    <option value="Nil">Nil</option>
                                    <option value="Ground Floor">1</option>
                                    <option value="First Floor">2</option>
                                    <option value="Second Floor">3</option>
                                    <option value="Third Floor">4</option>
                                    <option value="Fourth Floor">5</option>
                                </select>
                                {errors.numberOfFloors && <p className="text-red-500 text-sm mt-1">{errors.numberOfFloors}</p>}
                            </div>

                            {/* Floor Area field */}
                            <div className="flex flex-col">
                                <label className="block text-gray-700 font-bold mb-2">Floor Area (sq ft) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="floorArea"
                                    value={formData.floorArea}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                    required
                                />
                                {errors.floorArea && <p className="text-red-500 text-sm mt-1">{errors.floorArea}</p>}
                            </div>

                            {/* Usage Type field */}
                            <div className="flex flex-col">
                                <label className="block text-gray-700 font-bold mb-2">Usage type *</label>
                                <select
                                    name="usageType"
                                    value={formData.usageType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                    required
                                >
                                    <option value="">Select Usage</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Both">Both</option>
                                </select>
                                {errors.usageType && <p className="text-red-500 text-sm mt-1">{errors.usageType}</p>}
                            </div>

                            {/* Floor dropdown field */}
                            <div className="flex flex-col">
                                <label className="block text-gray-700 font-bold mb-2">Floor *</label>
                                <select
                                    name="floor"
                                    value={formData.floor}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                    required
                                >
                                    <option value="">Select Floor</option>
                                     <option value="Nil">Nil</option>
                                    <option value="Ground Floor">Ground Floor</option>
                                    <option value="First Floor">First Floor</option>
                                    <option value="Second Floor">Second Floor</option>
                                    <option value="Third Floor">Third Floor</option>
                                    <option value="Fourth Floor">Fourth Floor</option>
                                    <option value="Fifth Floor">Fifth Floor</option>
                                    <option value="Whole Building">Whole Building</option>
                                </select>
                                {errors.floor && <p className="text-red-500 text-sm mt-1">{errors.floor}</p>}
                            </div>

                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Step 4: Upload Photos</h3>

                        {/* Camera Modal */}
                        {showCamera && (
                            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                                {/* Video Preview */}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="flex-1 w-full object-contain bg-black"
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Controls */}
                                <div className="p-4 bg-black flex gap-4">
                                    <button
                                        type="button"
                                        onClick={capturePhoto}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition"
                                    >
                                        📸 Capture
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-700 transition"
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                            </div>
                        )}


                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Main Gate Photo */}
                            <div>
                                <label className="btn block text-gray-700 font-bold mb-2" htmlFor="mainGatePhoto" >Main Gate Photo *</label>

                                {/* Hidden input for device upload */}
                                <input
                                    type="file"
                                    name="mainGatePhoto"
                                    id="mainGatePhoto"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    required
                                />

                                {/* Buttons Row */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("mainGatePhoto").click()}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors text-center"
                                    >
                                        Upload from Device
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startCamera("mainGate")}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors text-center"
                                    >
                                        Camera
                                    </button>
                                </div>

                                {formData.mainGatePhotoBase64 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-green-600 text-sm">✓ Image Uploaded Successfully</p>
                                        <img
                                            src={formData.mainGatePhotoBase64}
                                            alt="Main Gate Preview"
                                            className="mt-2 w-full max-w-xs mx-auto h-auto object-contain rounded border border-gray-300"
                                        />
                                    </div>
                                )}
                                {errors.mainGatePhoto && (
                                    <p className="text-red-500 text-xs mt-1">{errors.mainGatePhoto}</p>
                                )}
                            </div>

                            {/* Building Photo */}
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Building Photo *</label>

                                <input
                                    type="file"
                                    name="buildingPhoto"
                                    id="buildingPhoto"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    required
                                />

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("buildingPhoto").click()}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors text-center"
                                    >
                                        Upload from Device
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startCamera("building")}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors text-center"
                                    >
                                        Camera
                                    </button>
                                </div>

                                {formData.buildingPhotoBase64 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-green-600 text-sm">✓ Image Uploaded Successfully</p>
                                        <img
                                            src={formData.buildingPhotoBase64}
                                            alt="Building Preview"
                                            className="mt-2 w-full max-w-xs mx-auto h-auto object-contain rounded border border-gray-300"
                                        />
                                    </div>
                                )}
                                {errors.buildingPhoto && (
                                    <p className="text-red-500 text-xs mt-1">{errors.buildingPhoto}</p>
                                )}
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <ToastContainer />
            <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-4xl">
                <div className="flex justify-center items-center mb-6">
                    <h2 className="text-3xl font-bold text-black-600">Property Survey Form</h2>
                </div>

                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div className="flex-1">
                            <div className="text-xs text-green-600 text-right">Step {step} of 4</div>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                        <div style={{ width: `${(step / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isSubmitted ? (
                        <div className="text-center p-8">
                            <h3 className="text-3xl font-bold text-green-700 mb-4">Submission Successful! 🎉</h3>
                            <p className="text-gray-600 mb-6">Thank you for submitting the form. Your data has been uploaded.</p>
                            <div className='flex justify-between items-center'>
                                <button
                                    type="button"
                                    onClick={handleSubmitAnother}
                                    className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                                >
                                    Submit Again
                                </button>
                                <button type="button"
                                    onClick={onLogout}
                                    className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {renderFormStep()}

                            <div className="flex justify-between mt-8">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevious}
                                        className="bg-gray-400 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors"
                                    >
                                        Previous
                                    </button>
                                )}
                                {step < 4 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors ml-auto"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors ml-auto ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                                    >
                                        {loading ? 'Submitting...' : 'Submit'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default App;