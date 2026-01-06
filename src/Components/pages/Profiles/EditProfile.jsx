import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { BACKEND_API_URL, handlesuccess, handleerror, getAsset } from "../../../utils/assets.js";
import { SquarePen, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function EditProfile({ theme = 'dark', isDark: isDarkProp, toggleTheme, sidebardata }) {
  const isDark = typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark'
  const [form, setForm] = useState({ full_name: '', phone_number: '' })
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const res = await axios.get(`${BACKEND_API_URL}/admin-portal/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = res.data.data.profile || {}
        setForm({
          full_name: data.full_name || '',
          phone_number: data.phone_number || ''
        })
        if (data.photo) {
          const normalizedPhoto = data.photo.replace(/\\/g, '/');
          setPhotoUrl(normalizedPhoto)
          localStorage.setItem('admin_profile_image', normalizedPhoto)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handlePickPhoto = () => document.getElementById('profile-photo-input')?.click()

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoUrl((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
  }

  useEffect(() => () => {
    if (photoUrl && photoUrl.startsWith('blob:')) URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('access_token')
      const fd = new FormData()
      if (form.full_name) fd.append('full_name', form.full_name)
      if (form.phone_number) fd.append('phone_number', form.phone_number)
      if (photoFile) fd.append('photo', photoFile)

      const res = await axios.put(`${BACKEND_API_URL}/admin-portal/profile`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      })
      const updated = res.data.data.profile || {}
      if (updated.photo) {
        const normalizedPhoto = updated.photo.replace(/\\/g, '/');
        localStorage.setItem('admin_profile_image', normalizedPhoto)
      }
      handlesuccess('Profile updated successfully')
      navigate('/Admin/Profile')
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update profile'
      handleerror(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-50 text-zinc-900'} h-screen transition-colors duration-300`}>
      <Sidebar isDark={isDark} sidebardata={sidebardata} />
      <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 transition-all duration-300`}>
        <div className="sticky top-0 z-20">
          <Header title="Edit Profile" isDark={isDark} toggleTheme={toggleTheme} isBack={true} backValue={"/Admin/Profile"} />
        </div>

        <main className="mt-6 overflow-y-auto no-scrollbar pr-1">
          <div className="max-w-5xl">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {photoUrl
                  ? <img
                    src={photoUrl}
                    onError={() => setPhotoUrl(null)}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-white/10"
                  />
                  : <div className="h-24 w-24 rounded-full ring-2 ring-white/10 flex items-center justify-center bg-zinc-800">
                    <User size={64} className="text-gray-300" />
                  </div>
                }
                <input id="profile-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <button onClick={handlePickPhoto} className={(isDark ? 'bg-white text-black hover:bg-gray-200 border border-zinc-200' : 'bg-gray-900 text-white hover:bg-black border border-zinc-700') + ' absolute -right-1 -bottom-1 h-8 w-8 rounded-full shadow flex items-center justify-center cursor-pointer'} aria-label="Change photo" type="button">
                  <SquarePen className="h-4 w-4" />
                </button>
              </div>
              <div className={(isDark ? "text-blue-400" : "text-blue-600") + " text-xs mt-2"}>Change Profile Picture</div>
            </div>

            <form className="grid grid-cols-1 gap-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {[{ key: 'full_name', label: 'Full Name', sub: 'Name', placeholder: 'Enter Your Name' },
              { key: 'phone_number', label: 'Phone Number', sub: 'Number', placeholder: '98564 25874' }].map((f) => (
                <div key={f.key} className={(isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200") + " border rounded-2xl p-4 sm:p-5 shadow-sm"}>
                  <div className={(isDark ? "text-white" : "text-gray-900") + " text-sm font-semibold mb-2"}>{f.label}</div>
                  {f.sub ? (
                    <div className={(isDark ? "text-gray-400" : "text-gray-500") + " text-xs mb-2"}>{f.sub}</div>
                  ) : null}
                  <input
                    type={f.key === 'phone_number' ? 'tel' : 'text'}
                    name={f.key}
                    value={form[f.key]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className={(isDark ? "bg-zinc-800 text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-zinc-600" : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400") + " h-11 w-full rounded-lg px-3 outline-none transition"}
                  />
                </div>
              ))}

              <div>
                <button type="button" onClick={() => navigate('/change-password')} className="text-red-500 hover:text-red-400 text-sm font-medium cursor-pointer">
                  Change Password
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                {/* <button type="button" onClick={() => navigate('/Admin/Profile')} className={(isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-gray-200 text-gray-900 hover:bg-gray-300") + " px-5 py-2 rounded-md font-semibold cursor-pointer"}>
                  Cancel
                </button> */}
                <button type="submit" disabled={isSubmitting} className={(isDark ? "bg-white text-black hover:bg-gray-200" : "bg-[#696CFF] text-white hover:bg.black") + " px-5 py-2 rounded-md font-semibold cursor-pointer disabled:opacity-60"}>{isSubmitting ? 'Saving...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EditProfile;


