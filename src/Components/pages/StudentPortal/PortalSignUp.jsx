import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon, ArrowLeft } from 'lucide-react';
import { getAsset, handlesuccess, handleerror } from '../../../utils/assets';
import { BACKEND_API_URL } from '../../../utils/assets';

function PortalSignUp({ isDark, toggleTheme }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        enrolment_number: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const handleLogin = async () => {
        const enrol = (formData.enrolment_number || '').trim();
        const pwd = (formData.password || '').trim();

        // Basic required check
        if (!enrol || !pwd) {
            const msg = 'Please enter your enrolment number and password';
            setError(msg);
            handleerror(msg);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/auth/login`,
                {
                    enrolment_number: formData.enrolment_number,
                    password: formData.password
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                const data = response.data;
                console.log('Login success:', data);

                if (data && data.token) {
                    localStorage.setItem('token', data.token);
                }

                // Save refresh token for student portal
                if (data && data.refresh_token) {
                    localStorage.setItem('student_refresh_token', data.refresh_token);
                }

                try {
                    localStorage.setItem('enrolment_number', formData.enrolment_number);
                } catch (e) {
                    console.error('Failed to persist enrolment_number:', e);
                }

                handlesuccess(data?.message || 'Login successfully');

                // Check profile status for navigation
                const profileComplete = data?.profile_complete;

                setTimeout(() => {
                    if (profileComplete) {
                        // Profile is true, navigate to StudentPortal/home
                        navigate('/StudentPortal/home');
                    } else {
                        // Profile is false, navigate to StudentPortal/PortalDetails
                        navigate('/StudentPortal/PortalDetails');
                    }
                }, 500);
            }
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error?.message ||
                'Login failed. Please try again.';

            console.error('Login error:', error);
            setError(message);
            handleerror(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-zinc-100'} flex items-center justify-center p-4 transition-colors duration-300`}>
            <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl px-2 sm:px-0">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block">
                        <div className={`flex flex-col items-center ${isDark ? 'text-white' : 'text-black'}`}>
                            <img
                                src={getAsset(isDark ? 'inailogo_dark' : 'inailogo_light')}
                                alt="INAI Logo"
                                className="w-40 md:w-48 h-auto mb-4"
                            />

                        </div>
                    </div>
                </div>

                {/* Login Card */}
                {/* <div className="bg-zinc-900 rounded-lg p-8 shadow-2xl"> */}
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className={`${isDark ? 'text-white' : 'text-black'} text-xl font-semibold mb-2`}>
                        Student Portal
                    </h2>
                    <p className={`${isDark ? 'text-white' : 'text-black'} text-sm`}>
                        Enter your credentials to Proceed your account
                    </p>
                </div>

                {/* Form */}
                <div className={`${isDark ? 'bg-[#1a1a1a] border-black' : 'bg-white border-gray-300'} rounded-2xl p-6 sm:p-8`}>
                    <div className="space-y-6 w-full">

                        {/* Sign In Your Account Header */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/Intro')}
                                className={`p-2 rounded-full hover:rounded-full transition-colors cursor-pointer ${isDark
                                    ? 'text-white hover:bg-zinc-800'
                                    : 'text-black hover:bg-gray-200'
                                    }`}
                                title="Go Back"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h3 className={`${isDark ? 'text-white' : 'text-black'} text-[25px] font-medium mb-1 -mt-2.5`}>
                                    Sign In Your Account
                                </h3>
                                <p className={`${isDark ? 'text-white' : 'text-black'} text-xs`}>
                                    Access your account to explore INAI's feature
                                </p>
                            </div>
                        </div>

                        {/* Enrolment Number Field */}
                        <div>
                            <label
                                className={`block ${isDark ? 'text-white' : 'text-black'} text-[14px] font-medium leading-none tracking-normal capitalize font-inter mb-2`}
                            >
                                Enrolment Number
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    name="enrolment_number"
                                    value={formData.enrolment_number}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full ${isDark ? 'bg-[#2a2a2a] text-white border-gray-600 focus:border-blue-500' : 'bg-zinc-100 text-black border-gray-300 focus:border-blue-500'} rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors`}
                                    placeholder="Enrolment Number"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                className={`block ${isDark ? 'text-white' : 'text-black'} text-[14px] font-medium leading-none tracking-normal capitalize font-inter mb-2`}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full ${isDark ? 'bg-[#2a2a2a] text-white border-gray-600 focus:border-blue-500' : 'bg-zinc-100 text-gray-900 border-gray-300 focus:border-blue-500'} rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none transition-colors`}
                                    placeholder="Enter Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-white' : 'text-black'} cursor-pointer transition-colors`}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className={`w-[50vh] px-8 py-3 font-medium rounded-full disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-[16px] cursor-pointer ${isDark
                                    ? 'bg-white text-black border border-zinc-600 hover:bg-zinc-100 hover:border-zinc-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                                    }`}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>

                    </div>
                </div>
                {/* </div> */}
            </div>
        </div>
    );
}

export default PortalSignUp;