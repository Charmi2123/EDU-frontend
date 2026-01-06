import React, { useState } from "react";
import { Globe2, Lock, Bell, ChevronDown, Globe, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets";

function Settings({ isDark, toggleTheme, sidebardata }) {
    const shellBg = isDark ? "bg-black text-[#E5E7EB]" : "bg-[#F5F7FB] text-[#0F172A]";

    const cardBase = isDark
        ? "bg-zinc-900 border border-zinc-800"
        : "bg-white border border-[#E5E7EB]";

    const subtleText = isDark ? "text-zinc-400" : "text-black";

    const inputBase = isDark
        ? "bg-zinc-800 border-zinc-800 placeholder:text-zinc-500"
        : "bg-zinc-100 border-[#E5E7EB] placeholder:text-zinc-400";

    const toggleTrack = isDark ? "bg-white" : "bg-zinc-800";

    const [language, setLanguage] = useState("English");
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [pwErrors, setPwErrors] = useState({ current: "", new: "", confirm: "", form: "" });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const getToggleClasses = (enabled) =>
        `relative inline-flex h-5 w-9 items-center rounded-full ${toggleTrack} cursor-pointer transition-colors`;

    const getKnobClasses = (enabled) =>
        `inline-block h-4 w-4 transform rounded-full ${isDark ? "bg-zinc-800" : "bg-white"
        } transition-transform ${enabled ? "translate-x-4" : "translate-x-1"}`;

    const handlePasswordChange = (field, value) => {
        setPasswords((prev) => ({ ...prev, [field]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleUpdatePassword = async () => {
        if (pwLoading) return;

        // Clear previous errors
        setPwErrors({ current: "", new: "", confirm: "", form: "" });

        // Check if passwords match
        if (passwords.new !== passwords.confirm) {
            const msg = "Passwords do not match";
            setPwErrors((prev) => ({ ...prev, confirm: msg }));
            handleerror(msg);
            return;
        }

        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!token) {
            const msg = "You are not logged in. Please login again.";
            setPwErrors((prev) => ({ ...prev, form: msg }));
            handleerror(msg);
            return;
        }

        setPwLoading(true);
        try {
            const payload = {
                current_password: passwords.current,
                new_password: passwords.new,
                confirm_password: passwords.confirm,
            };

            const res = await axios.post(`${BACKEND_API_URL}/school-portal/auth/change-password`, payload, {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const msg = res.data?.detail || res.data?.message || "Password changed successfully";
            handlesuccess(msg);
            setPasswords({ current: "", new: "", confirm: "" });
            setPwErrors({ current: "", new: "", confirm: "", form: "" });
            setPwSuccess(true);
            setTimeout(() => {
                setPwSuccess(false);
            }, 2000);
        } catch (error) {
            const msg =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                "Failed to change password";
            setPwErrors((prev) => ({ ...prev, form: msg }));
            handleerror(msg);
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300">
                <div className="sticky top-0 z-20">
                    <Portalheader title="Settings" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                <main className="mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
                    <div className="mb-1">
                        <h2 className="font-bold text-[26px] leading-none tracking-normal mb-3">Settings</h2>
                        <p className={`text-[18px] font-normal leading-none tracking-normal ${subtleText}`}>
                            "Personalize your experience with easy-to-use settings"
                        </p>
                    </div>

                    <div className="relative flex-1 min-h-0 mt-3">
                        <div className="w-full h-full flex flex-col gap-5 md:gap-6 overflow-y-auto no-scrollbar pb-6">
                            <section className={`${cardBase} rounded-2xl px-4 md:px-6 py-4 md:py-5`}>
                                <div className="flex items-start gap-3 mb-4">
                                    <div
                                        className="items-center mt-3"
                                    >
                                        <Globe className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-base font-semibold">
                                            Language
                                        </h3>
                                        <p className={`text-xs md:text-sm mt-1 ${subtleText}`}>
                                            Select your preferred language
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2 grid gap-2 max-w-sm">
                                    <label className={`text-xs md:text-sm ${subtleText}`}>
                                        Select Language
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="language-select"
                                            value={language}
                                            onChange={(e) => {
                                                const newLang = e.target.value;
                                                setLanguage(newLang);
                                            }}
                                            className={`${inputBase
                                                } border rounded-lg px-3 py-2 pr-8 text-xs md:text-sm cursor-pointer appearance-none w-full`}
                                        >
                                            <option value="Hindi">Hindi</option>
                                            <option value="English">English</option>
                                            <option value="Gujarati">Gujarati</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-80" />
                                    </div>
                                </div>
                            </section>

                            <section className={`${cardBase} rounded-2xl px-4 md:px-6 py-4 md:py-5`}>
                                <div className="flex items-start gap-3 mb-4">
                                    <div
                                        className="items-center mt-3"
                                    >
                                        <Lock className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-base font-semibold">
                                            Password
                                        </h3>
                                        <p className={`text-xs md:text-sm mt-1 ${subtleText}`}>
                                            Update your password
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 max-w-xl">
                                    <div className="grid gap-1">
                                        <label className={`text-xs md:text-sm ${subtleText}`}>
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                className={`${inputBase
                                                    } border rounded-lg px-3 py-2 pr-10 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full`}
                                                placeholder="Enter current password"
                                                value={passwords.current}
                                                onChange={(e) => handlePasswordChange("current", e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility("current")}
                                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'} transition-colors`}
                                            >
                                                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {pwErrors.current && (
                                            <p className="text-xs text-red-400 mt-1">{pwErrors.current}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-1">
                                        <label className={`text-xs md:text-sm ${subtleText}`}>
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                className={`${inputBase
                                                    } border rounded-lg px-3 py-2 pr-10 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full`}
                                                placeholder="Enter new password"
                                                value={passwords.new}
                                                onChange={(e) => handlePasswordChange("new", e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility("new")}
                                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'} transition-colors`}
                                            >
                                                {showPasswords.new ? <EyeOff className="w-5 h-5 " /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {pwErrors.new && (
                                            <p className="text-xs text-red-400 mt-1">{pwErrors.new}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-1">
                                        <label className={`text-xs md:text-sm ${subtleText}`}>
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                className={`${inputBase
                                                    } border rounded-lg px-3 py-2 pr-10 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full`}
                                                placeholder="Confirm new password"
                                                value={passwords.confirm}
                                                onChange={(e) => handlePasswordChange("confirm", e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility("confirm")}
                                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'} transition-colors`}
                                            >
                                                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {pwErrors.confirm && (
                                            <p className="text-xs text-red-400 mt-1">{pwErrors.confirm}</p>
                                        )}
                                    </div>

                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={handleUpdatePassword}
                                            disabled={pwLoading}
                                            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs md:text-sm font-medium ${isDark
                                                ? "bg-white text-black hover:bg-zinc-100"
                                                : "bg-indigo-500 text-white hover:bg-indigo-600"
                                                } transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                                        >
                                            {pwLoading ? "Updating..." : "Update Password"}
                                        </button>
                                        {pwErrors.form && (
                                            <p className="text-xs text-red-400 mt-2">{pwErrors.form}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className={`${cardBase} rounded-2xl px-4 md:px-6 py-4 md:py-5 mb-4`}>
                                <div className="flex items-start gap-3 mb-4">
                                    <div
                                        className="items-center mt-3"
                                    >
                                        <Bell className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-base font-semibold">
                                            Notifications
                                        </h3>
                                        <p className={`text-xs md:text-sm mt-1 ${subtleText}`}>
                                            Manage your notification preferences
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 divide-y divide-zinc-800/60">
                                    <div className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium">Email Notifications</p>
                                            <p className={`text-xs mt-0.5 ${subtleText}`}>
                                                Receive updates via email
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEmailEnabled((prev) => !prev)}
                                            className={getToggleClasses(emailEnabled)}
                                        >
                                            <span className={getKnobClasses(emailEnabled)} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <div>
                                            <p className="text-sm font-medium">Push Notifications</p>
                                            <p className={`text-xs mt-0.5 ${subtleText}`}>
                                                Receive push notifications
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPushEnabled((prev) => !prev)}
                                            className={getToggleClasses(pushEnabled)}
                                        >
                                            <span className={getKnobClasses(pushEnabled)} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <div>
                                            <p className="text-sm font-medium">SMS Notifications</p>
                                            <p className={`text-xs mt-0.5 ${subtleText}`}>
                                                Receive updates via SMS
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSmsEnabled((prev) => !prev)}
                                            className={getToggleClasses(smsEnabled)}
                                        >
                                            <span className={getKnobClasses(smsEnabled)} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>

            {pwSuccess && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                    <div className={`${isDark ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-zinc-900 border-zinc-200"} rounded-xl px-6 py-4 shadow-xl border`}>
                        <div className="text-sm font-medium">Password updated successfully</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;

