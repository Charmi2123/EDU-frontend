import React, { useEffect, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { useNavigate } from "react-router-dom";
import { SquarePen, User } from "lucide-react";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";

function Profile({ theme, isDark: isDarkProp, toggleTheme, sidebardata }) {
  const [profile, setProfile] = useState(null);
  const isDark = typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark'
  const [id, setid] = useState(localStorage.getItem('admin_id'))
  const navigate = useNavigate();


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${BACKEND_API_URL}/admin-portal/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        const profileData = response.data.data.profile;

        // Normalize photo path
        if (profileData.photo) {
          profileData.photo = profileData.photo.replace(/\\/g, '/');
        }

        setProfile(profileData);

        if (profileData.photo) {
          localStorage.setItem('admin_profile_image', profileData.photo);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
    fetchProfile();
  }, [])

  return (
    <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-50 text-zinc-900'} h-screen transition-colors duration-300`}>
      <Sidebar isDark={isDark} sidebardata={sidebardata} />
      <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 transition-all duration-300`}>
        <div className="sticky top-0 z-20">
          <Header title="Profile" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        <main className="mt-6 overflow-y-auto no-scrollbar pr-1">
          <div className="max-w-5xl">
            {/* Avatar with edit */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {profile?.photo ? (
                  <img
                    src={`${profile.photo}`}
                    onError={() => setProfile((prev) => ({ ...prev, photo: null }))}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full ring-2 ring-white/10 flex items-center justify-center bg-zinc-800">
                    <User size={64} className="text-gray-300" />
                  </div>
                )}
                <div
                  onClick={() => navigate(`/Admin/Profile/Edit`)}
                  className={(isDark ? 'bg-white text-black hover:bg-gray-200 border border-zinc-200' : 'bg-gray-900 text-white hover:bg-black border border-zinc-700') + ' absolute -right-1 -bottom-1 h-8 w-8 rounded-full cursor-pointer shadow flex items-center justify-center'}
                  aria-label="Edit profile"
                >
                  <SquarePen className="h-4 w-4" />
                </div>
              </div>
              <div className="text-center mt-2">
                <div className={(isDark ? 'text-white' : 'text-gray-900') + ' text-lg font-semibold'}>{profile?.full_name}</div>
                <div className={(isDark ? 'text-gray-400' : 'text-gray-600') + ' text-xs'}>{profile?.designation || 'Admin'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[{ k: 'Phone Number', v: profile?.phone_number }, { k: 'Email ID', v: profile?.email }].map((item, idx) => (
                <div
                  key={idx}
                  className={(isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200") + " border rounded-2xl p-4 sm:p-5 shadow-sm"}
                >
                  <div
                    className={(isDark ? "text-white" : "text-gray-900") + " text-sm font-semibold mb-2"}
                  >{item.k}</div>
                  <div className={(isDark ? "bg-zinc-800 text-gray-200" : "bg-gray-100 text-gray-900") + " min-h-10 w-full rounded-lg px-3 py-2 flex items-center"}>
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile;


