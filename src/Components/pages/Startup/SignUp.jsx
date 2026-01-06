import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CloudUpload, ChevronDown, CheckCircle2, X, Eye, EyeOff, ArrowLeft } from "lucide-react";
import axios from "axios";
import { getAsset, handlesuccess, handleerror, BACKEND_API_URL } from "../../../utils/assets.js";

const formatDateToDMY = (value = '') => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
};

function SignUp({ theme = 'dark', isDark: isDarkProp }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [state, setState] = useState({});
    const isDark = typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark';
    const [currentStep, setCurrentStep] = useState(1);
    const [isDragging, setIsDragging] = useState(null);

    useEffect(() => {
        setState(location.state);
    }, [])

    useEffect(() => {
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            window.scrollTo(0, 0);
        }
    }, [currentStep])

    // Step 1: Contact Person Details
    const [contactFormData, setContactFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        designation: '',
        phoneNumber: '',
        email: state.email,
        dob: ''
    });

    // Step 2: Education Center Details
    const [educationFormData, setEducationFormData] = useState({
        nameOfEducationCenter: '',
        governmentProof: [],
        educationCenterPhotos: [],
        logo: null,
        otherActivities: []
    });

    const [isDesignationOpen, setIsDesignationOpen] = useState(false);
    const designationRef = useRef(null);

    const designationOptions = [
        { value: "super admin", label: "Super Admin" },
        { value: "admin", label: "Admin" },
        { value: "HOD( head of department )", label: "HOD( Head of Department )" },
        { value: "manager", label: "Manager" },
        { value: "vice principle", label: "Vice Principle" },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (designationRef.current && !designationRef.current.contains(event.target)) {
                setIsDesignationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleContactChange = (e) => {
        setContactFormData({
            ...contactFormData,
            [e.target.name]: e.target.value
        });
    };

    const MultiFileUploadField = ({ label, name, values = [], onAdd }) => {
        const [previews, setPreviews] = useState([]);

        React.useEffect(() => {
            let isMounted = true;
            if (!values || !values.length) { setPreviews([]); return; }
            Promise.all(values.map(file => new Promise((res) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result);
                reader.readAsDataURL(file);
            }))).then(arr => { if (isMounted) setPreviews(arr); });
            return () => { isMounted = false; };
        }, [values]);

        return (
            <div>
                <label className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    {label}
                </label>
                <div
                    onClick={() => document.getElementById(`${name}-multi-input`).click()}
                    onDragOver={(e) => handleDragOver(e, name)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, name)}
                    className={`
                        ${isDragging === name ? (isDark ? "border-[#696CFF] bg-[#696CFF]/10" : "border-[#696CFF] bg-[#696CFF]/5") : (isDark ? "border-[#696CFF] bg-zinc-900/30" : "border-[#696CFF] bg-white")}
                        border-2 border-dashed rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:bg-[#696CFF]/5
                    `}
                >
                    <input
                        type="file"
                        id={`${name}-multi-input`}
                        name={name}
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length) onAdd(name, files);
                            e.target.value = '';
                        }}
                        className="hidden"
                    />
                    {values && values.length ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {values.map((file, idx) => (
                                <div key={idx} className="relative group">
                                    {previews[idx] ? (
                                        <img src={previews[idx]} alt={`${label}-${idx}`} className="w-full h-24 sm:h-28 object-cover rounded-lg" />
                                    ) : (
                                        <div className={(isDark ? "bg-zinc-800" : "bg-gray-100") + " w-full h-24 sm:h-28 rounded-lg"} />
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveFile(name, e, idx)}
                                        className={(isDark ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600") + " absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors shadow-lg"}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className={(isDark ? "bg-black/60" : "bg-white/80") + " absolute bottom-0 left-0 right-0 p-1.5 rounded-b-lg"}>
                                        <p className={(isDark ? "text-white" : "text-gray-900") + " text-[10px] font-medium truncate"}>{file.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <CloudUpload className="text-[#696CFF] w-8 h-8 mb-2" />
                            <p className="text-sm font-medium mb-1">
                                <span className="text-[#696CFF]">Click to upload</span>
                                <span className={isDark ? "text-gray-400" : "text-gray-500"}> or drag and drop</span>
                            </p>
                            <p className={(isDark ? "text-gray-400" : "text-gray-500") + " text-xs"}>
                                SVG, PNG, JPG or GIF<br />
                                (max, 800x400px)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleEducationChange = (e) => {
        if (e.target.type === 'file') {
            const { name, files } = e.target;
            if (name === 'logo') {
                setEducationFormData(prev => ({ ...prev, logo: files[0] || null }));
            } else {
                const list = Array.from(files || []);
                setEducationFormData(prev => ({ ...prev, [name]: list }));
            }
        } else {
            setEducationFormData({
                ...educationFormData,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleFileUpload = (name, payload) => {
        if (name === 'logo') {
            setEducationFormData(prev => ({ ...prev, logo: payload || null }));
        } else {
            const files = Array.isArray(payload) ? payload : payload ? [payload] : [];
            setEducationFormData(prev => ({ ...prev, [name]: [...(prev[name] || []), ...files] }));
        }
    };

    const handleRemoveFile = (name, e, index = null) => {
        e.stopPropagation();
        if (name === 'logo') {
            setEducationFormData(prev => ({ ...prev, logo: null }));
        } else if (index !== null) {
            setEducationFormData(prev => {
                const next = Array.from(prev[name] || []);
                next.splice(index, 1);
                return { ...prev, [name]: next };
            });
        }
    };

    const handleDragOver = (e, name) => {
        e.preventDefault();
        setIsDragging(name);
    };

    const handleDragLeave = () => {
        setIsDragging(null);
    };

    const handleDrop = (e, name) => {
        e.preventDefault();
        setIsDragging(null);
        const incoming = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
        if (!incoming.length) return;
        if (name === 'logo') {
            handleFileUpload(name, incoming[0]);
        } else {
            handleFileUpload(name, incoming);
        }
    };

    const handleNextStep1 = (e) => {
        e.preventDefault();
        const missing = [];
        if (!contactFormData.firstName?.trim()) missing.push('First Name');
        if (!contactFormData.lastName?.trim()) missing.push('Last Name');
        if (!contactFormData.address?.trim()) missing.push('Address');
        if (!contactFormData.designation?.trim()) missing.push('Designation');
        if (!contactFormData.phoneNumber?.trim()) missing.push('Phone Number');
        if (!contactFormData.dob?.trim()) missing.push('Date of Birth');
        const emailOk = /.+@.+\..+/.test(contactFormData.email || '');
        if (contactFormData.email && !emailOk) return handleerror('Enter a valid email');
        if (missing.length) return handleerror(`Required ${missing[0]}`);
        setCurrentStep(2);
    };

    const handleNextStep2 = (e) => {
        e.preventDefault();
        const missingFiles = [];
        if (!educationFormData.governmentProof.length) missingFiles.push('Government Proof');
        if (!educationFormData.educationCenterPhotos.length) missingFiles.push('Education Cover Photos');
        if (!educationFormData.logo) missingFiles.push('Logo');
        if (!educationFormData.otherActivities.length) missingFiles.push('Other Activities');
        if (missingFiles.length) return handleerror(`Please upload: ${missingFiles.join(', ')}`);
        setCurrentStep(3);
    };

    const [credData, setCredData] = useState({ password: '' })
    const [showCredPassword, setShowCredPassword] = useState(false)
    useEffect(() => {
        if (state?.password && !credData.password) {
            setCredData(prev => ({ ...prev, password: state.password }))
        }
    }, [state?.password])
    const handleCredChange = (e) => {
        setCredData({ ...credData, [e.target.name]: e.target.value })
    }
    const handleFinish = async (e) => {
        e.preventDefault();
        if (!state?.email || !credData.password?.trim()) {
            return handleerror('INAI Email missing or password empty');
        }
        const emailOk = /.+@.+\..+/.test(state.email || '');
        if (!emailOk) return handleerror('Enter a valid INAI Email');
        const fd = new FormData();
        fd.append('first_name', contactFormData.firstName || '');
        fd.append('last_name', contactFormData.lastName || '');
        fd.append('education_center_name', educationFormData.nameOfEducationCenter || '');
        fd.append('address', contactFormData.address || '');
        fd.append('designation', contactFormData.designation || '');
        fd.append('phone_number', contactFormData.phoneNumber || '');
        fd.append('dob', formatDateToDMY(contactFormData.dob));
        fd.append('inai_email', state.email || '');
        fd.append('inai_password', credData.password || '');
        if (educationFormData.governmentProof.length) {
            educationFormData.governmentProof.forEach(file => fd.append('image', file));
        }
        if (educationFormData.educationCenterPhotos.length) {
            educationFormData.educationCenterPhotos.forEach(file => fd.append('center_photos', file));
        }
        if (educationFormData.logo) fd.append('logo', educationFormData.logo);
        if (educationFormData.otherActivities.length) {
            educationFormData.otherActivities.forEach(file => fd.append('other_activity', file));
        }
        try {
            const headers = {
                'Authorization': state.token ? `Bearer ${state.token}` : undefined,
                // Let axios set proper boundary for multipart; do not manually set unless needed
            };
            const res = await axios.post(`${BACKEND_API_URL}/contact/`, fd, { headers });
            if (res.status === 200 || res.status === 201) {
                handlesuccess('contact completed');
                navigate('/login');
            } else {
                handleerror('Failed to complete signup');
            }
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Failed to complete signup';
            handleerror(Array.isArray(msg) ? msg.map(x => x?.msg).join(', ') : msg);
        }
    }

    const renderStep1 = () => (
        <form onSubmit={handleNextStep1} className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Grid Layout for First Name and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* First Name */}
                <div>
                    <label htmlFor="firstName" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                        First Name
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={contactFormData.firstName}
                        onChange={handleContactChange}
                        placeholder="Enter First name"
                        className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 hover:border-opacity-60"}
                    />
                </div>

                {/* Last Name */}
                <div>
                    <label htmlFor="lastName" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                        Last Name
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={contactFormData.lastName}
                        onChange={handleContactChange}
                        placeholder="Enter Last name"
                        className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 hover:border-opacity-60"}
                    />
                </div>
            </div>

            {/* Address */}
            <div>
                <label htmlFor="address" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    Address (Current & Permanent)
                </label>
                <textarea
                    id="address"
                    name="address"
                    value={contactFormData.address}
                    onChange={handleContactChange}
                    placeholder="Enter Current Address"
                    rows="3"
                    className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 resize-none hover:border-opacity-60"}
                />
            </div>

            {/* Designation */}
            <div>
                <label htmlFor="designation" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    Designation
                </label>
                <div className="relative" ref={designationRef}>
                    <div
                        onClick={() => setIsDesignationOpen(!isDesignationOpen)}
                        className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 hover:border-white/50" : "bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-900") + ` w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 cursor-pointer flex items-center justify-between ${isDesignationOpen ? (isDark ? 'border-white/50 ring-2 ring-white/20' : 'border-gray-900 ring-2 ring-gray-900/20') : ''}`}
                    >
                        <span className={!contactFormData.designation ? (isDark ? "text-gray-400" : "text-gray-400") : ""}>
                            {contactFormData.designation
                                ? designationOptions.find(opt => opt.value === contactFormData.designation)?.label || contactFormData.designation
                                : "Select Designation"
                            }
                        </span>
                        <ChevronDown className={(isDark ? "text-gray-400" : "text-gray-500") + ` w-4 h-4 transition-transform duration-300 ${isDesignationOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isDesignationOpen && (
                        <div className={(isDark ? "bg-zinc-900 border-zinc-700 shadow-xl shadow-black/50" : "bg-white border-gray-200 shadow-xl") + " absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"}>
                            <div className="max-h-[200px] overflow-y-auto no-scrollbar p-1.5">
                                {designationOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            handleContactChange({ target: { name: 'designation', value: option.value } });
                                            setIsDesignationOpen(false);
                                        }}
                                        className={(isDark
                                            ? `text-gray-200 hover:bg-zinc-800 hover:text-white ${contactFormData.designation === option.value ? "bg-zinc-800 text-white" : ""}`
                                            : `text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${contactFormData.designation === option.value ? "bg-gray-100 text-gray-900" : ""}`
                                        ) + " px-3.5 py-2.5 text-sm rounded-lg cursor-pointer transition-colors duration-200 font-medium"}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Layout for Phone and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 sm:gap-5">
                {/* Phone Number */}
                <div>
                    <label htmlFor="phoneNumber" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={contactFormData.phoneNumber}
                        onChange={handleContactChange}
                        placeholder="00000 00000"
                        minLength={10}
                        maxLength={10}
                        className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 hover:border-opacity-60"}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="dob" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    Date of Birth
                </label>
                <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={contactFormData.dob}
                    onChange={handleContactChange}
                    className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300"}
                />
            </div>

            {/* Next Button */}
            <div className="pt-3 sm:pt-4">
                <button
                    type="submit"
                    className={(isDark ? "bg-white text-black hover:bg-gray-100 active:scale-[0.98]" : "bg-[#696CFF] text-white active:scale-[0.98]") + " w-full font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl py-3.5 sm:py-4 transition-all duration-300 transform hover:scale-[1.02] shadow-md cursor-pointer"}
                >
                    Next →
                </button>
            </div>
        </form>
    );

    // Enhanced File Upload Component
    const FileUploadField = ({ label, name, value, onChange }) => {
        const [preview, setPreview] = useState(null);

        React.useEffect(() => {
            if (value) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(value);
            } else {
                setPreview(null);
            }
        }, [value]);

        return (
            <div>
                <label className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    {label}
                </label>
                <div
                    onClick={() => !value && document.getElementById(`${name}-input`).click()}
                    onDragOver={(e) => handleDragOver(e, name)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, name)}
                    className={`
                        ${isDragging === name ? (isDark ? "border-[#696CFF] bg-[#696CFF]/10" : "border-[#696CFF] bg-[#696CFF]/5") : (isDark ? "border-[#696CFF] bg-zinc-900/30" : "border-[#696CFF] bg-white")}
                        ${value ? "border-solid" : "border-2 border-dashed"}
                        rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:bg-[#696CFF]/5
                        ${value ? "" : "hover:scale-[1.01]"}
                    `}
                >
                    <input
                        type="file"
                        id={`${name}-input`}
                        name={name}
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                onChange(name, file);
                            }
                        }}
                        className="hidden"
                    />
                    {value && preview ? (
                        <div className="relative group">
                            <img
                                src={preview}
                                alt={label}
                                className="w-full h-32 sm:h-40 object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={(e) => handleRemoveFile(name, e)}
                                className={(isDark ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600") + " absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors shadow-lg"}
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className={(isDark ? "bg-black/60" : "bg-white/80") + " absolute bottom-0 left-0 right-0 p-2 rounded-b-lg"}>
                                <p className={(isDark ? "text-white" : "text-gray-900") + " text-xs font-medium truncate"}>
                                    {value.name}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <CloudUpload className="text-[#696CFF] w-8 h-8 mb-2" />
                            <p className="text-sm font-medium mb-1">
                                <span className="text-[#696CFF]">Click to upload</span>
                                <span className={isDark ? "text-gray-400" : "text-gray-500"}> or drag and drop</span>
                            </p>
                            <p className={(isDark ? "text-gray-400" : "text-gray-500") + " text-xs"}>
                                SVG, PNG, JPG or GIF<br />
                                (max, 800x400px)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderStep2 = () => (
        <form onSubmit={handleNextStep2} className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Name Of Education Center */}
            <div>
                <label htmlFor="nameOfEducationCenter" className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    Name Of Education Center
                </label>
                <input
                    type="text"
                    id="nameOfEducationCenter"
                    name="nameOfEducationCenter"
                    value={educationFormData.nameOfEducationCenter}
                    onChange={handleEducationChange}
                    placeholder="Enter Name of Education center"
                    className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 hover:border-opacity-60"}
                />
            </div>

            {/* Government Proof Of Education Center (multiple) */}
            <MultiFileUploadField
                label="Government Proof Of Education Center"
                name="governmentProof"
                values={educationFormData.governmentProof}
                onAdd={handleFileUpload}
            />

            {/* Education Cover Photos (multiple) */}
            <MultiFileUploadField
                label="Education Cover Photos"
                name="educationCenterPhotos"
                values={educationFormData.educationCenterPhotos}
                onAdd={handleFileUpload}
            />

            {/* Logo (single) */}
            <FileUploadField
                label="Logo"
                name="logo"
                value={educationFormData.logo}
                onChange={handleFileUpload}
            />

            {/* Other Activities Of Center (multiple) */}
            <MultiFileUploadField
                label="Other Activities Of Center"
                name="otherActivities"
                values={educationFormData.otherActivities}
                onAdd={handleFileUpload}
            />

            {/* Next Button */}
            <div className="pt-3 sm:pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentStep(1); }}
                    className={(isDark ? "bg-transparent text-white border border-white/40 hover:bg-white/10" : "bg-transparent text-gray-900 border border-gray-900/40 hover:bg-gray-900/5") + " w-full font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl py-3.5 sm:py-4 transition-all duration-300 cursor-pointer"}
                >
                    Previous
                </button>
                <button
                    type="submit"
                    className={(isDark ? "bg-white text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 active:scale-[0.98]" : "bg-[#696CFF] text-white active:scale-[0.98]") + " w-full font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl py-3.5 sm:py-4 transition-all duration-300 transform hover:scale-[1.02] shadow-md cursor-pointer"}
                >
                    Next →
                </button>
            </div>
        </form>
    );

    const renderStep3 = () => (
        <form onSubmit={handleFinish} className="space-y-4 sm:space-y-5 animate-fadeIn">
            <div>
                <label className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    INAI Email
                </label>
                <input
                    type="email"
                    disabled
                    readOnly
                    value={state?.email || ''}
                    placeholder="Enter INAI Email"
                    className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 outline-none transition-all duration-300 hover:border-opacity-60"}
                />
            </div>

            <div>
                <label className={(isDark ? "text-white" : "text-gray-900") + " block text-sm font-semibold mb-2.5"}>
                    INAI Password
                </label>
                <div className="relative">
                    <input
                        type={showCredPassword ? 'text' : 'password'}
                        name="password"
                        value={credData.password}
                        onChange={handleCredChange}
                        placeholder="Enter INAI password"
                        className={(isDark ? "bg-zinc-900/50 text-white border-zinc-700 placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-white/20" : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20") + " w-full text-sm border rounded-xl px-4 py-3 pr-12 outline-none transition-all duration-300 hover:border-opacity-60"}
                    />
                    <button
                        type="button"
                        onClick={() => setShowCredPassword(!showCredPassword)}
                        className={(isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900") + " absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"}
                        aria-label={showCredPassword ? 'Hide password' : 'Show password'}
                    >
                        {showCredPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className="pt-3 sm:pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={(isDark ? "bg-transparent text-white border border-white/40 hover:bg-white/10" : "bg-transparent text-gray-900 border border-gray-900/40 hover:bg-gray-900/5") + " w-full font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl py-3.5 sm:py-4 transition-all duration-300 cursor-pointer"}
                >
                    Previous
                </button>
                <button
                    type="submit"
                    className={(isDark ? "bg-white text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 active:scale-[0.98]" : "bg-[#696CFF] text-white active:scale-[0.98]") + " w-full font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl py-3.5 sm:py-4 transition-all duration-300 transform hover:scale-[1.02] shadow-md cursor-pointer"}
                >
                    Sign Up
                </button>
            </div>
        </form>
    )

    return (
        <div className={(isDark ? "bg-linear-to-br from-black via-zinc-950 to-black" : "bg-linear-to-br from-gray-50 via-white to-gray-100") + " w-full h-screen flex flex-col lg:flex-row overflow-hidden fixed inset-0"}>
            {/* Left Section: Logo */}
            <div className="lg:w-1/3 w-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 h-[18vh] sm:h-[20vh] md:h-[22vh] lg:h-screen lg:overflow-hidden shrink-0 relative">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/10 lg:bg-linear-to-r lg:from-transparent lg:via-transparent lg:to-black/10" />
                <div className="text-center w-full relative z-10">
                    <img
                        src={getAsset(isDark ? 'inailogo_dark' : 'inailogo_light')}
                        alt="INAI VERSE Logo"
                        className="w-auto h-20 sm:h-24 md:h-28 lg:h-36 xl:h-40 max-h-[14vh] sm:max-h-[16vh] md:max-h-[18vh] lg:max-h-[45vh] object-contain mx-auto transition-all duration-500 hover:scale-105"
                    />
                </div>
            </div>

            {/* Right Section: Form */}
            <div className="lg:w-2/3 w-full flex items-start lg:items-center justify-center p-4 sm:p-5 md:p-6 lg:p-10 xl:p-12 h-[82vh] sm:h-[80vh] md:h-[78vh] lg:h-screen overflow-y-auto no-scrollbar pb-4 sm:pb-6 md:pb-8">
                <div className={(isDark ? "bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 shadow-2xl shadow-black/50" : "bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl shadow-gray-900/10") + " w-full max-w-2xl rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 my-4 lg:my-auto transition-all duration-500 relative"}>

                    {/* Back Button */}
                    <button
                        onClick={() => navigate("/login")}
                        className={(isDark ? "text-gray-200 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100") + " absolute top-4 left-4 cursor-pointer sm:top-6 sm:left-6 p-2 rounded-full transition-all duration-300"}
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Step Indicator */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${currentStep >= 1 ? (isDark ? "bg-white text-black" : "bg-[#696CFF] text-white") : (isDark ? "bg-zinc-700 text-gray-400" : "bg-gray-200 text-gray-400")} font-bold text-xs sm:text-sm transition-all duration-300`}>
                                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : "1"}
                            </div>
                            <div className={`h-0.5 w-10 sm:w-12 ${currentStep >= 2 ? (isDark ? "bg-white" : "bg-[#696CFF]") : (isDark ? "bg-zinc-700" : "bg-gray-200")} rounded-full transition-all duration-300`} />
                            <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${currentStep >= 2 ? (isDark ? "bg-white text-black" : "bg-[#696CFF] text-white") : (isDark ? "bg-zinc-700 text-gray-400" : "bg-gray-200 text-gray-400")} font-bold text-xs sm:text-sm transition-all duration-300`}>
                                {currentStep > 2 ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : "2"}
                            </div>
                            <div className={`h-0.5 w-10 sm:w-12 ${currentStep >= 3 ? (isDark ? "bg-white" : "bg-[#696CFF]") : (isDark ? "bg-zinc-700" : "bg-gray-200")} rounded-full transition-all duration-300`} />
                            <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${currentStep >= 3 ? (isDark ? "bg-white text-black" : "bg-[#696CFF] text-white") : (isDark ? "bg-zinc-700 text-gray-400" : "bg-gray-200 text-gray-400")} font-bold text-xs sm:text-sm transition-all duration-300`}>
                                {currentStep > 3 ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : "3"}
                            </div>
                        </div>
                    </div>

                    {/* Form Header */}
                    <div className="mb-6 sm:mb-8 text-center">
                        <h2 className={(isDark ? "text-white" : "text-gray-900") + " text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3"}>
                            {currentStep === 1 ? "Contact Person Details" : "Education Center Details"}
                        </h2>
                        <p className={(isDark ? "text-gray-400" : "text-gray-600") + " text-xs sm:text-sm"}>
                            {currentStep === 1 ? "Please provide your contact information" : currentStep === 2 ? "Upload your education center documents" : "Enter credentials provided by INAI"}
                        </p>
                    </div>

                    {/* Form Content */}
                    <div className="transition-all duration-500">
                        {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
                    </div>
                </div>
            </div>

            {/* Add CSS animations */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

export default SignUp;
