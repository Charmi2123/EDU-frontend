import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, KeyRound } from "lucide-react";
import { getAsset, handlesuccess, handleerror, BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        new_password: "",
        confirm_password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [passwordStrength, setPasswordStrength] = useState(0);

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    useEffect(() => {
        if (!theme) {
            setTheme(localStorage.getItem("theme"));
        }
    }, [localStorage.getItem("theme")]);

    const isDark = useMemo(() => theme === "dark", [theme]);

    // Redirect if token or email is missing
    useEffect(() => {
        if (!token || !email) {
            handleerror("Invalid reset link. Missing token or email.");
        }
    }, [token, email]);

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 6) strength += 1;
        if (pass.length >= 10) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9!@#$%^&*]/.test(pass)) strength += 1;
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === "new_password") {
            setPasswordStrength(calculateStrength(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token || !email) {
            handleerror("Invalid reset link.");
            return;
        }

        if (!formData.new_password || !formData.confirm_password) {
            handleerror("Please fill in all fields");
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            handleerror("Passwords do not match");
            return;
        }

        if (formData.new_password.length < 6) {
            handleerror("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${BACKEND_API_URL}/auth/reset-password`,
                {
                    email: email,
                    reset_token: token,
                    new_password: formData.new_password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "accept": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                handlesuccess(response.data?.message || "Password reset successfully");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to reset password. Please try again.";
            handleerror(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper for strength color
    const getStrengthColor = (index) => {
        if (passwordStrength === 0) return isDark ? "bg-zinc-700" : "bg-zinc-200";
        if (index < passwordStrength) {
            if (passwordStrength <= 2) return "bg-red-500";
            if (passwordStrength === 3) return "bg-yellow-500";
            return "bg-green-500";
        }
        return isDark ? "bg-zinc-700" : "bg-zinc-200";
    };

    return (
        <div
            className={`relative w-full h-screen flex flex-col items-center justify-center overflow-hidden px-4 transition-colors duration-500 ${isDark
                ? "bg-[#09090b] text-white"
                : "bg-[#F5F5F9] text-zinc-900"
                }`}
        >
            {/* Background Blobs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 animate-float ${isDark ? "bg-indigo-600" : "bg-indigo-400"}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 animate-float delay-1000 ${isDark ? "bg-purple-600" : "bg-purple-400"}`}></div>

            {/* Logo Area */}
            <div className="mb-8 z-10 animate-fade-in-down">
                <img
                    src={getAsset(isDark ? "inailogo_dark" : "inailogo_light")}
                    alt="INAI VERSE Logo"
                    className="h-16 md:h-20 object-contain drop-shadow-lg"
                />
            </div>

            {/* Main Card */}
            <div className={`w-full max-w-md z-10 perspective-1000`}>
                <div
                    className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 border backdrop-blur-xl ${isDark
                        ? "bg-zinc-900/60 border-zinc-800/50 shadow-black/50"
                        : "bg-white/70 border-white/50 shadow-zinc-200/50"
                        }`}
                >

                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-zinc-800 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                                <KeyRound className="w-8 h-8" />
                            </div>
                            <h2 className={`text-2xl sm:text-3xl font-bold mb-2 tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                                Set New Password
                            </h2>
                            <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                Your new password must be different from previously used passwords.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password Field */}
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                                    New Password
                                </label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-zinc-500 group-focus-within:text-indigo-400" : "text-zinc-400 group-focus-within:text-indigo-600"}`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="new_password"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        placeholder="Create new password"
                                        className={`w-full pl-12 pr-12 py-4 rounded-xl text-sm font-medium transition-all duration-300 outline-none border-2 ${isDark
                                            ? "bg-zinc-800/50 border-zinc-700/50 text-white focus:border-indigo-500/50 focus:bg-zinc-800 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] placeholder:text-zinc-600"
                                            : "bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] placeholder:text-zinc-400"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"}`}
                                    >
                                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Strength Meter */}
                                {formData.new_password && (
                                    <div className="flex gap-1.5 mt-2 px-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${getStrengthColor(i - 1)}`}
                                            ></div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-zinc-500 group-focus-within:text-indigo-400" : "text-zinc-400 group-focus-within:text-indigo-600"}`}>
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        className={`w-full pl-12 pr-12 py-4 rounded-xl text-sm font-medium transition-all duration-300 outline-none border-2 ${isDark
                                            ? "bg-zinc-800/50 border-zinc-700/50 text-white focus:border-indigo-500/50 focus:bg-zinc-800 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] placeholder:text-zinc-600"
                                            : "bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] placeholder:text-zinc-400"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className={`absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"}`}
                                    >
                                        {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full cursor-pointer py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isDark
                                    ? "bg-white text-black hover:bg-zinc-200 shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.2)]"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.4)]"
                                    }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting...
                                    </span>
                                ) : (
                                    "Reset Password"
                                )}
                            </button>

                            {/* Back Link */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className={`w-full text-sm cursor-pointer font-medium transition-colors ${isDark ? "text-zinc-500 hover:text-white" : "text-zinc-500 hover:text-zinc-900"}`}
                                >
                                    ← Back to Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer/Copyright */}
            <div className={`absolute bottom-6 text-xs font-medium opacity-50 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                © {new Date().getFullYear()} ED INAI. All rights reserved.
            </div>
        </div>
    );
}

export default ResetPassword;
