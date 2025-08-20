import React, { useState, useEffect } from 'react';
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
        numberOfFloors: [],
        floorArea: '',
        usageType: '',
        mainGatePhoto: null,
        buildingPhoto: null,
        mainGatePhotoBase64: '',
        buildingPhotoBase64: '',
    });
    const [loading, setLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

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

    // Handle location and autofill on component load
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
                            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                            const address = res.data.address;
                            setFormData((prevData) => ({
                                ...prevData,
                                propertyAddress: res.data.display_name,
                                zipCode: address.postcode || '',
                            }));
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
            if (formData.numberOfFloors.length === 0) newErrors.numberOfFloors = 'At least one floor must be selected.';
            if (!formData.floorArea || isNaN(formData.floorArea)) newErrors.floorArea = 'Floor Area is required and must be a number.';
            if (!formData.usageType) newErrors.usageType = 'Usage Type is required.';
        } else if (step === 4) {
            if (!formData.mainGatePhotoBase64) newErrors.mainGatePhoto = 'Main Gate photo is required.';
            if (!formData.buildingPhotoBase64) newErrors.buildingPhoto = 'Building photo is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            const newFloors = checked
                ? [...formData.numberOfFloors, value]
                : formData.numberOfFloors.filter((floor) => floor !== value);
            setFormData({ ...formData, numberOfFloors: newFloors });
        } else if (name.startsWith('tenantDetails.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                tenantDetails: { ...formData.tenantDetails, [field]: value },
            });
        } else {
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
            numberOfFloors: [],
            floorArea: '',
            usageType: '',
            mainGatePhoto: null,
            buildingPhoto: null,
            mainGatePhotoBase64: '',
            buildingPhotoBase64: '',
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
                                <input type="text" name="surveyorName" value={formData.surveyorName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
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
                                        onChange={handleChange}
                                        className="w-full pl-24 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                        pattern="[0-9]{10}"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-100" readOnly />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Ward No *</label>
                                <input type="text" name="wardNo" value={formData.wardNo} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                {errors.wardNo && <p className="text-red-500 text-xs mt-1">{errors.wardNo}</p>}
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-gray-700 font-bold mb-2">Property Address *</label>
                            <textarea name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} rows="3" className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none" readOnly={formData.propertyAddress !== ''} required />
                            {errors.propertyAddress && <p className="text-red-500 text-xs mt-1">{errors.propertyAddress}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.latitude && formData.longitude && `Latitude: ${formData.latitude.toFixed(6)}, Longitude: ${formData.longitude.toFixed(6)}`}
                                {locationError && <span className="text-red-500 block">{locationError}</span>}
                            </p>
                        </div>
                        <div className="mt-4">
                            <label className="block text-gray-700 font-bold mb-2">ZIP/Postal Code *</label>
                            <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none" readOnly={formData.zipCode !== ''} required />
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
                                <input type="text" name="occupiersName" value={formData.occupiersName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                {errors.occupiersName && <p className="text-red-500 text-xs mt-1">{errors.occupiersName}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Father's Name *</label>
                                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Mother's Name *</label>
                                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
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
                                <select name="ownerOrTenant" value={formData.ownerOrTenant} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                    <option value="Owner">Owner</option>
                                    <option value="Tenant">Tenant</option>
                                </select>
                            </div>
                        </div>
                        {formData.ownerOrTenant === 'Tenant' && (
                            <div className="mt-8 bg-green-50 p-6 rounded-lg border border-green-200">
                                <h4 className="text-xl font-bold text-green-800 mb-4">Tenant Details</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Monthly Rent *</label>
                                        <input type="number" name="tenantDetails.monthlyRent" value={formData.tenantDetails.monthlyRent} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                        {errors.monthlyRent && <p className="text-red-500 text-xs mt-1">{errors.monthlyRent}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Name *</label>
                                        <input type="text" name="tenantDetails.ownerName" value={formData.tenantDetails.ownerName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                        {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Father's Name *</label>
                                        <input type="text" name="tenantDetails.ownerFatherName" value={formData.tenantDetails.ownerFatherName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                        {errors.ownerFatherName && <p className="text-red-500 text-xs mt-1">{errors.ownerFatherName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">Owner's Mother's Name *</label>
                                        <input type="text" name="tenantDetails.ownerMotherName" value={formData.tenantDetails.ownerMotherName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
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
                                        <textarea name="tenantDetails.streetAddress" value={formData.tenantDetails.streetAddress} onChange={handleChange} rows="3" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required></textarea>
                                        {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-green-800 font-bold mb-2">ZIP/Postal Code *</label>
                                        <input type="text" name="tenantDetails.zipCode" value={formData.tenantDetails.zipCode} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
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
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Area of Plot (sq ft) *</label>
                                <input type="number" name="areaOfPlot" value={formData.areaOfPlot} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                {errors.areaOfPlot && <p className="text-red-500 text-xs mt-1">{errors.areaOfPlot}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Nature of Building *</label>
                                <select name="natureOfBuilding" value={formData.natureOfBuilding} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                    <option value="">Select Type</option>
                                    <option value="Flat">Flat</option>
                                    <option value="Builder Floor">Builder Floor</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                </select>
                                {errors.natureOfBuilding && <p className="text-red-500 text-xs mt-1">{errors.natureOfBuilding}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Number of floors *</label>
                                <div className="flex flex-wrap gap-4">
                                    {['Basement', '1', '2', '3', '4', '5'].map((floor) => (
                                        <label key={floor} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="numberOfFloors"
                                                value={floor}
                                                checked={formData.numberOfFloors.includes(floor)}
                                                onChange={handleChange}
                                                className="form-checkbox h-5 w-5 text-green-600 rounded"
                                            />
                                            <span>{floor}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.numberOfFloors && <p className="text-red-500 text-xs mt-1">{errors.numberOfFloors}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Floor Area (sq ft) *</label>
                                <input type="number" name="floorArea" value={formData.floorArea} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                {errors.floorArea && <p className="text-red-500 text-xs mt-1">{errors.floorArea}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Usage type *</label>
                                <select name="usageType" value={formData.usageType} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                    <option value="">Select Usage</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                </select>
                                {errors.usageType && <p className="text-red-500 text-xs mt-1">{errors.usageType}</p>}
                            </div>
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Step 4: Upload Photos</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Main Gate Photo *</label>
                                <input type="file" name="mainGatePhoto" id="mainGatePhoto" accept="image/*" onChange={handleFileChange} className="hidden" required />
                                <label htmlFor="mainGatePhoto" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors w-full text-center block">
                                    Choose File
                                </label>
                                {formData.mainGatePhotoBase64 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-green-600 text-sm">✓ Image Uploaded Successfully</p>
                                        <img
                                            src={formData.mainGatePhotoBase64}
                                            alt="Main Gate Preview"
                                            className="mt-2 w-full h-48 object-cover rounded border border-gray-300"
                                        />
                                    </div>
                                )}
                                {errors.mainGatePhoto && <p className="text-red-500 text-xs mt-1">{errors.mainGatePhoto}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Building Photo *</label>
                                <input type="file" name="buildingPhoto" id="buildingPhoto" accept="image/*" onChange={handleFileChange} className="hidden" required />
                                <label htmlFor="buildingPhoto" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors w-full text-center block">
                                    Choose File
                                </label>
                                {formData.buildingPhotoBase64 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-green-600 text-sm">✓ Image Uploaded Successfully</p>
                                        <img
                                            src={formData.buildingPhotoBase64}
                                            alt="Building Preview"
                                            className="mt-2 w-full h-48 object-cover rounded border border-gray-300"
                                        />
                                    </div>
                                )}
                                {errors.buildingPhoto && <p className="text-red-500 text-xs mt-1">{errors.buildingPhoto}</p>}
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-100 relative font-sans">
            {!isSubmitted ? (
                <>
                    <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Property Survey Form</h2>
                    {/* Step Indicators */}
                    <div className="mb-8 flex justify-center space-x-4">
                        <span className={`text-xl font-semibold w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>1</span>
                        <span className={`text-xl font-semibold w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>2</span>
                        <span className={`text-xl font-semibold w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>3</span>
                        <span className={`text-xl font-semibold w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${step >= 4 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>4</span>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">
                        {renderFormStep()}
                        <div className="flex justify-between mt-8">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-300"
                                >
                                    Previous
                                </button>
                            )}

                            <div className="ml-auto flex gap-4">
                                {step < 4 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-300"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400"
                                    >
                                        {loading ? 'Submitting...' : 'Submit'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // Success Screen
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white p-12 rounded-xl shadow-lg border border-gray-200">
                        <div className="mb-8">
                            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-4xl font-extrabold text-green-600 mb-4">
                            Form Submitted Successfully!
                        </h2>

                        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                            Your property tax survey form has been successfully submitted. Click below to submit another response for a different property or Click Logout Button to Login with different credentials.
                        </p>

                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleSubmitAnother}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-300 text-lg"
                            >
                                Submit Another Response
                            </button>
                            <button
                                onClick={onLogout}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-300 text-lg"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default App;