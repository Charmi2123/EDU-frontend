import React, { useMemo, useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { getAsset, BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ChangePassword({ theme = 'dark', isDark: isDarkProp, toggleTheme }) {
    const isDark = useMemo(() => (typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark'), [isDarkProp, theme])
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [errors, setErrors] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '', form: '' })
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validate = () => {
        const nextErrors = { oldPassword: '', newPassword: '', confirmNewPassword: '', form: '' }
        const hasLetter = /[A-Za-z]/.test(formData.newPassword)
        const hasNumber = /\d/.test(formData.newPassword)
        const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.newPassword)

        if (!formData.oldPassword) {
            nextErrors.oldPassword = 'Please enter your old password.'
        }
        if (formData.newPassword.length < 6) {
            nextErrors.newPassword = 'Password must be at least 6 characters.'
        }
        if (!(hasLetter && hasNumber && hasSpecial)) {
            nextErrors.newPassword = nextErrors.newPassword || 'Include letters, numbers, and a special character.'
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
            nextErrors.confirmNewPassword = 'Passwords do not match.'
        }

        setErrors(nextErrors)
        return !Object.values(nextErrors).some(Boolean)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setErrors((prev) => ({ ...prev, form: 'You are not logged in. Please login again.' }));
                handleerror('You are not logged in. Please login again.');
                return;
            }

            const payload = {
                old_password: formData.oldPassword,
                new_password: formData.newPassword
            };

            const res = await axios.post(`${BACKEND_API_URL}/admin-portal/change-password`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const msg = res.data?.detail || res.data?.message || 'Password changed successfully';
            handlesuccess(msg);
            setTimeout(() => {
                navigate('/admin/profile')
            }, 2000);
            setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
            setErrors({ oldPassword: '', newPassword: '', confirmNewPassword: '', form: '' });
        } catch (err) {
            const msg =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Failed to change password';
            setErrors((prev) => ({ ...prev, form: msg }));
            handleerror(msg);
        }
    };

    return (
        <div className={(isDark ? "bg-black text-gray-100" : "bg-white text-gray-900") + " w-full h-screen flex flex-col lg:flex-row overflow-hidden fixed inset-0"}>
            {/* Left Section: Logo - Mobile/Tablet: Top, Desktop: Left */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-12 xl:p-16 h-[20vh] sm:h-[22vh] md:h-[25vh] lg:h-screen lg:overflow-hidden shrink-0 lg:shrink">
                <div className="text-center w-full">
                    <img
                        src={getAsset(isDark ? 'inailogo_dark' : 'inailogo_light')}
                        alt="INAI VERSE Logo"
                        className="w-auto h-24 sm:h-24 md:h-24 lg:h-32 xl:h-36 max-h-[12vh] sm:max-h-[15vh] md:max-h-[18vh] lg:max-h-[40vh] object-contain mx-auto transition-all duration-300"
                    />
                </div>
            </div>

            {/* Right Section: Change Password Form - Scrollable only in this section */}
            <div className="lg:w-1/2 w-full flex items-start lg:items-center justify-center p-3 sm:p-4 md:p-4 lg:p-10 xl:p-12 h-[80vh] sm:h-[78vh] md:h-[75vh] lg:h-screen overflow-y-auto no-scrollbar pb-4 sm:pb-6 md:pb-8">
                <div className={(isDark ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-zinc-200 shadow-sm") + " w-full max-w-lg lg:max-w-lg rounded-xl p-4 sm:p-5 md:p-5 lg:p-8 xl:p-10 my-4 lg:my-auto"}>
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/Admin/Profile')}
                        className={`mb-4 flex items-center cursor-pointer gap-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {/* Form Header */}
                    <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 relative">
                        <h2 className={(isDark ? "text-white" : "text-gray-900") + " text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-center"}>
                            Change Password
                        </h2>
                        <p className={(isDark ? "text-gray-300" : "text-gray-600") + " text-xs sm:text-sm md:text-base leading-relaxed text-center px-1"}>
                            Password Must Be At Least 6 Characters Long And Include Letters, Numbers, And Special Characters (E.G., !$@%)
                        </p>
                        {/* Theme toggle intentionally removed: theme follows system or saved preference */}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
                        {/* Old Password Field */}
                        <div>
                            <label htmlFor="oldPassword" className={(isDark ? "text-white" : "text-gray-900") + " block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2"}>
                                Old Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    id="oldPassword"
                                    name="oldPassword"
                                    placeholder="Enter Old Password"
                                    value={formData.oldPassword}
                                    onChange={handleChange}
                                    className={(isDark ? "bg-zinc-900 text-white border-zinc-700 placeholder-gray-400 focus:border-zinc-600" : "bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-400") + " w-full text-sm sm:text-base border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 pr-10 sm:pr-12 outline-none transition-colors"}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className={(isDark ? "text-gray-400 hover:text-white active:text-white" : "text-gray-500 hover:text-gray-700 active:text-gray-700") + " absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer touch-manipulation z-10"}
                                    aria-label={showOldPassword ? "Hide password" : "Show password"}
                                >
                                    {showOldPassword ? (
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.oldPassword && (
                                <p className="mt-1 text-xs text-red-400">{errors.oldPassword}</p>
                            )}
                        </div>

                        {/* New Password Field */}
                        <div>
                            <label htmlFor="newPassword" className={(isDark ? "text-white" : "text-gray-900") + " block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2"}>
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="newPassword"
                                    name="newPassword"
                                    placeholder="Enter Password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className={(isDark ? "bg-zinc-900 text-white border-zinc-700 placeholder-gray-400 focus:border-zinc-600" : "bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-400") + " w-full text-sm sm:text-base border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 pr-10 sm:pr-12 outline-none transition-colors"}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className={(isDark ? "text-gray-400 hover:text-white active:text-white" : "text-gray-500 hover:text-gray-700 active:text-gray-700") + " absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer touch-manipulation z-10"}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? (
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="mt-1 text-xs text-red-400">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirm New Password Field */}
                        <div>
                            <label htmlFor="confirmNewPassword" className={(isDark ? "text-white" : "text-gray-900") + " block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2"}>
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmNewPassword ? "text" : "password"}
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    placeholder="Enter Password"
                                    value={formData.confirmNewPassword}
                                    onChange={handleChange}
                                    className={(isDark ? "bg-zinc-900 text-white border-zinc-700 placeholder-gray-400 focus:border-zinc-600" : "bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-gray-400") + " w-full text-sm sm:text-base border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 pr-10 sm:pr-12 outline-none transition-colors"}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                    className={(isDark ? "text-gray-400 hover:text-white active:text-white" : "text-gray-500 hover:text-gray-700 active:text-gray-700") + " absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer touch-manipulation z-10"}
                                    aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmNewPassword ? (
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmNewPassword && (
                                <p className="mt-1 text-xs text-red-400">{errors.confirmNewPassword}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-1 sm:pt-2">
                            <button
                                type="submit"
                                className={(isDark ? "bg-white text-black hover:bg-gray-100 active:bg-gray-200" : "bg-[#696CFF] text-white hover:bg-[#696CFF]/80") + " cursor-pointer w-full font-bold text-xs sm:text-sm md:text-base lg:text-lg uppercase tracking-wider rounded-lg py-2 sm:py-2.5 md:py-3 transition-colors touch-manipulation"}
                            >
                                Submit
                            </button>
                            {errors.form && (
                                <p className="mt-2 text-xs text-red-400 text-center">{errors.form}</p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;

