import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAsset, handlesuccess, handleerror } from "../../../utils/assets";
import { useNavigate } from "react-router-dom";
import { BACKEND_API_URL } from "../../../utils/assets";

// Theme related utility functions
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  }
  // Default to dark when no explicit preference is stored
  return 'dark';
};
function PortalDetails() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme());
  
  // Apply theme class to root element
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    last_name: "",
    classStream: "",
    division: "",
    classHead: "",
    enrollmentNumber: "",
    mobileNumber: "",
    parentsNumber: "",
    emailAddress: "",
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const storedEnrollment =
      localStorage.getItem('enrolment_number')

    if (!storedEnrollment) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_API_URL}/school-portal/profile-status/${storedEnrollment}`,
          {
            headers: {
              accept: 'application/json',
            },
          }
        );

        const data = res.data || {};
        const prefill = data.prefill || {};

        setFormData(prev => ({
          ...prev,
          firstName: prefill.first_name || '',
          middleName: prefill.middle_name || '',
          last_name: prefill.last_name || '',
          classStream: prefill.class_stream || '',
          division: prefill.division || '',
          classHead: prefill.class_head || '',
          enrollmentNumber: prefill.enrollment_number || storedEnrollment,
          // backend sample me mobile/email nahi the, isliye yahan top-level se try karte hain
          mobileNumber: data.mobile_number || '',
          parentsNumber: data.parents_number || '',
          emailAddress: data.email || '',
        }));

        if (data.photo) {
          setPreview(data.photo);
        }
      } catch (error) {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch profile details';

        console.error('Profile status fetch error:', error);
        handleerror(msg);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Convert email to lowercase
    if (e.target.name === 'emailAddress') {
      value = value.toLowerCase();
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const onPickPhoto = (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      handleerror('Only PNG and JPG images are allowed');
      return;
    }
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onPickPhoto(file);
  };

  const onBrowse = (e) => {
    const file = e.target.files?.[0];
    if (file) onPickPhoto(file);
  };

  const handleSave = async () => {
    console.log("Form data:", formData);
    console.log("Photo:", photo);

    // Read fields for validation
    const {
      firstName,
      middleName,
      last_name,
      classStream,
      division,
      classHead,
      enrollmentNumber,
      mobileNumber,
      parentsNumber,
      emailAddress,
    } = formData;

    // Regex rules
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^\d{10,11}$/;
    const emailRegex = /^[^\s@]+@gmail\.com$/;

    // Required + format for each field with clear messages
    if (!firstName?.trim()) {
      handleerror('First Name is required');
      return;
    }
    if (!nameRegex.test(firstName)) {
      handleerror('First Name should contain only characters');
      return;
    }

    if (!middleName?.trim()) {
      handleerror('Middle Name is required');
      return;
    }
    if (!nameRegex.test(middleName)) {
      handleerror('Middle Name should contain only characters');
      return;
    }

    if (!last_name?.trim()) {
      handleerror('Father Name is required');
      return;
    }
    if (!nameRegex.test(last_name)) {
      handleerror('Father Name should contain only characters');
      return;
    }

    if (!classStream?.trim()) {
      handleerror('Class / Stream is required');
      return;
    }

    if (!division?.trim()) {
      handleerror('Division is required');
      return;
    }
    if (!nameRegex.test(division)) {
      handleerror('Division should contain only characters');
      return;
    }

    if (!classHead?.trim()) {
      handleerror('Class Head is required');
      return;
    }
    if (!nameRegex.test(classHead)) {
      handleerror('Class Head should contain only characters');
      return;
    }

    if (!enrollmentNumber?.trim()) {
      handleerror('Enrollment Number is required');
      return;
    }

    if (!mobileNumber?.trim()) {
      handleerror('Mobile Number is required');
      return;
    }
    if (!phoneRegex.test(mobileNumber)) {
      handleerror('Mobile Number should contain only digits and be 10 or 11 digits long');
      return;
    }

    if (!parentsNumber?.trim()) {
      handleerror('Parents Number is required');
      return;
    }
    if (!phoneRegex.test(parentsNumber)) {
      handleerror('Parents Number should contain only digits and be 10 or 11 digits long');
      return;
    }

    if (!emailAddress?.trim()) {
      handleerror('Email Address is required');
      return;
    }
    if (!emailRegex.test(emailAddress)) {
      handleerror('Email must be a valid Gmail address (@gmail.com)');
      return;
    }

    if (!photo) {
      handleerror('Student Photo is required (JPG or PNG)');
      return;
    }

    const payload = new FormData();
    payload.append('enrollment_number', formData.enrollmentNumber || '');
    payload.append('mobile_number', formData.mobileNumber || '');
    payload.append('class_stream', formData.classStream || '');
    payload.append('class_head', formData.classHead || '');
    payload.append('division', formData.division || '');
    payload.append('first_name', formData.firstName || '');
    payload.append('middle_name', formData.middleName || '');
    payload.append('last_name', formData.last_name || '');
    payload.append('email', formData.emailAddress || '');
    payload.append('parents_number', formData.parentsNumber || '');
    if (photo) {
      payload.append('photo', photo);
    }

    try {
      const res = await axios.post(
        `${BACKEND_API_URL}/school-portal/profile`,
        payload,
        {
          headers: {
            accept: 'application/json',
          },
        }
      );

      if (res.status === 200 || res.status === 201) {
        handlesuccess(res.data?.message || 'Profile saved successfully');

        try {
          localStorage.setItem('studentDetailsCompleted', 'true');
        } catch (e) {
          console.error('Failed to persist student details completion flag:', e);
        }

        navigate('/StudentPortal/home');
      } else {
        handleerror('Failed to save profile');
      }
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to save profile';

      console.error('Profile save error:', error);
      handleerror(msg);
    }
  };

  // Dynamic classes based on theme
  const containerCls = `min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-black' : 'bg-zinc-100'}`;
  const formContainerCls = `w-full max-w-3xl rounded-2xl p-6 md:p-8 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`;
  const inputCls = `w-full rounded-md px-3 py-2 text-sm border ${theme === 'dark' 
    ? 'bg-zinc-800 border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#3A3A3A]' 
    : 'bg-[#F5F5F5] border-[#E0E0E0] text-black placeholder-[#999999] focus:border-[#4A4AFF]'} focus:outline-none`;
  const labelCls = `block mb-2 text-[14px] font-medium leading-[100%] capitalize mb-1 font-[Inter] ${theme === 'dark' ? 'text-white' : 'text-black'}`;
  const headingCls = `text-[32px] font-bold leading-[100%] capitalize mb-4 font-[Inter] ${theme === 'dark' ? 'text-white' : 'text-[#333333]'}`;

  return (
    <div className={`w-full ${containerCls}`}>
      <div className={`w-full md:w-2/3 flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black' : 'bg-zinc-100'}`}>
        <div className="text-center">
          <div className="flex flex-col items-center">
            <img
              src={getAsset(theme === 'dark' ? 'inailogo_dark' : 'inailogo_light')}
              alt="INAI Logo"
              className="w-40 md:w-60 h-auto"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-3/5 flex items-center justify-center p-4 sm:p-8">
        <div className={formContainerCls}>
          <h2 className={headingCls}>
            Student Details
          </h2>


          <div className="space-y-3">
            <div>
              <label className={labelCls}>
                First Name
              </label>

              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter First name"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Enter Middle name"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Father Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter father name"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Class / Stream</label>
                <input
                  type="text"
                  name="classStream"
                  value={formData.classStream}
                  
                  disabled
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Division</label>
                <input
                  type="text"
                  name="division"
                  value={formData.division}
                  
                  disabled
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Faculty</label>
                <input
                  type="text"
                  name="classHead"
                  value={formData.classHead}
                  onChange={handleChange}
                  placeholder="Enter Facutity Name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Enrollment Number</label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  
                  disabled
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter Mobile Number"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Parents Number</label>
                <input
                  type="tel"
                  name="parentsNumber"
                  value={formData.parentsNumber}
                  onChange={handleChange}
                  placeholder="Enter Parents Number"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                placeholder="Enter Email address"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Upload Student Photo</label>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-lg w-full flex flex-col items-center justify-center h-24 cursor-pointer transition-colors ${theme === 'dark' ? 'bg-zinc-800 border-[#4A4AFF] hover:border-[#5A5AFF]' : 'bg-[#F5F5F5] border-[#C3C3FF] hover:border-[#4A4AFF]'}`}
              >
                <input
                  type="file"
                  id="student-photo-input"
                  accept="image/*"
                  className="hidden"
                  onChange={onBrowse}
                />
                {preview ? (
                  <img src={preview} alt="preview" className="h-20 object-contain rounded" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <img src={getAsset('upload_dark')} alt=""  className="w-6 h-5" />
                    <div className="text-gray-500 text-xs">
                      <span className="text-[#4A4AFF] font-medium">Click to browse</span> or drag and drop
                    </div>
                    <div className="text-gray-600 text-xs">PNG, JPG or JPEG</div>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-center pt-3">
              <button
                onClick={handleSave}
                className={`cursor-pointer w-full py-3 px-6 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-white hover:white text-black' : 'bg-[#6B46C1] hover:bg-[#5A3AA3] text-white'} `}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default PortalDetails;
