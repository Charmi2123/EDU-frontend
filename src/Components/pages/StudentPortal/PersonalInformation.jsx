import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { User, Users, Hash, Mail, School, GraduationCap, Building2, Phone, Layers, UserCheck } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL } from "../../../utils/assets.js";

function PersonalInformation({ isDark, toggleTheme, sidebardata }) {
    const shellBg = isDark ? "bg-black text-gray-100" : "bg-zinc-100 text-zinc-900";
    const panelBg = isDark ? "bg-zinc-900" : "bg-white";
    const inputBg = isDark ? "bg-zinc-800/80" : "bg-zinc-100";
    const inputText = isDark ? "text-gray-100" : "text-zinc-900";
    const subText = isDark ? "text-gray-400" : "text-zinc-500";

    const normalizePhotoUrl = (photoPath) => {
        if (!photoPath) return "";
        if (/^https?:\/\//i.test(photoPath)) return photoPath;

        const cleaned = String(photoPath).replace(/\\/g, "/");
        if (cleaned.startsWith("/")) return `${BACKEND_API_URL}${cleaned}`;
        return `${BACKEND_API_URL}/${cleaned}`;
    };

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        enrollment_number: "",
        email: "",
        class_stream: "",
        division: "",
        class_head: "",
        mobile_number: "",
        parents_number: "",
        photo: "",
        photo_path: "",
    });

    useEffect(() => {
        
        const storedEnrollment =
            localStorage.getItem('enrolment_number') ||
            localStorage.getItem('enrollment_number');

        if (!storedEnrollment) {
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${BACKEND_API_URL}/school-portal/profile/${storedEnrollment}`,
                    {
                        headers: {
                            accept: 'application/json',
                        },
                    }
                );

                const data = res.data || {};
                console.log('API Response:', data);
                console.log('Photo path from API:', data.photo_path);

                const photoUrl = normalizePhotoUrl(data.photo_path);
                console.log('Final photo URL:', photoUrl);

                setProfile({
                    first_name: data.first_name || "",
                    middle_name: data.middle_name || "",
                    last_name: data.last_name || "",
                    enrollment_number: data.enrollment_number || storedEnrollment,
                    email: data.email || "",
                    class_stream: data.class_stream || "",
                    division: data.division || "",
                    class_head: data.class_head || "",
                    mobile_number: data.mobile_number || "",
                    parents_number: data.parents_number || "",
                    photo_path: photoUrl,
                });
            } catch (error) {
                console.error("Failed to fetch student profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const Field = ({ icon: Icon, label, value }) => (
        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-xl p-4 transition-shadow duration-200`}>
            <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${inputText}`} />
                <div className="flex-1 min-w-0">
                    <div className={`text-xs ${subText} mb-1`}>{label}</div>
                    <div className={`text-sm font-medium ${inputText} truncate`}>{value}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            <Sidebar isDark={isDark} sidebardata={sidebardata} />
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300">
                <div className="sticky top-0 z-20">
                    <Portalheader title="Student Profile" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                <main className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 md:px-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-500 animate-spin"></div>
                                <div className="text-sm opacity-60">Loading profile...</div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mb-6 mx-auto">
                            {/* Panel with overlapping avatar */}
                            <div className={`relative ${panelBg} rounded-2xl pt-20 p-6 md:pt-24 md:p-8 mt-16`}>
                                {/* Floating avatar */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                                    <div className="w-32 h-32 flex items-center justify-center">
                                        <div className={`w-28 h-28 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                            {profile.photo_path ? (
                                                <img
                                                    alt="avatar"
                                                    src={profile.photo_path}
                                                    className="w-full h-full object-cover rounded-full"

                                                    onError={(e) => {
                                                        console.log('Profile image failed to load, showing default icon');
                                                        console.log('Failed URL:', e.target.src);
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'flex';
                                                    }}
                                                    onLoad={(e) => {
                                                        console.log('Profile image loaded successfully:', e.target.src);
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`${profile.photo_path ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                                                <User className={`w-16 h-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Name and subtext centered under avatar */}
                                {/* <div className="flex flex-col items-center mb-6 -mt-5">
                                    <h1 className="text-xl font-semibold text-center">
                                        {profile.first_name ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1) : ""}
                                    </h1>
                                    <div className={`mt-1 text-sm ${subText} text-center`}>
                                        {profile.class_stream || ""}
                                    </div>
                                </div> */}

                                <div className="space-y-8">
                                    {/* Personal Information */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/90' : 'bg-zinc-700'}`} />
                                            <h2 className="text-sm font-semibold">Personal Information</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <Field icon={Users} label="First Name" value={profile.first_name || ""} />
                                            <Field icon={Users} label="Middle Name" value={profile.middle_name || ""} />
                                            <Field icon={User} label="Last Name" value={profile.last_name || ""} />
                                            <Field icon={Mail} label="Email Address" value={profile.email || ""} />
                                        </div>
                                    </section>

                                    {/* Academic Information */}
                                    <section className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                       <div className="flex items-center gap-2 mb-4">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/90' : 'bg-zinc-700'}`} />
                                            <h2 className="text-sm font-semibold">Academic Information</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <Field icon={GraduationCap} label="Class / Stream" value={profile.class_stream || ""} />
                                            <Field icon={Layers} label="Division" value={profile.division || ""} />
                                            <Field icon={UserCheck} label="Class Head" value={profile.class_head || ""} />
                                            <Field icon={Hash} label="Enrollment Number" value={profile.enrollment_number || ""} />
                                        </div>
                                    </section>

                                    {/* Contact Information */}
                                    <section className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/90' : 'bg-zinc-700'}`} />
                                            <h2 className="text-sm font-semibold">Contact Information</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <Field icon={Phone} label="Mobile Number" value={profile.mobile_number || ""} />
                                            <Field icon={Phone} label="Parents Number" value={profile.parents_number || ""} />
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default PersonalInformation;