import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { handlesuccess, handleerror, BACKEND_API_URL, getAsset } from '../../../utils/assets'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

function AddStudent({ theme, isDark, toggleTheme, sidebardata, title = 'Add Student' }) {
  const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark'
  const [form, setForm] = useState({
    enrollment_number: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const localTitle = isEdit ? 'Edit Student' : title

  const inputCls = `w-full rounded-lg px-3 py-2.5 text-[13px] md:text-sm focus:outline-none focus:ring-2 border ${
    resolvedDark
      ? 'bg-[#1A1A1A] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-700'
      : 'bg-zinc-100 border-[#E5E7EB] text-black placeholder:text-zinc-400 focus:ring-[#696CFF]/30'
  }`;

  useEffect(() => {
    if (!isEdit) return
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`${BACKEND_API_URL}/studentm/get_student/${id}`)
        const payload = res?.data || {}
        const d = payload?.data || payload?.student || payload
        setForm({
          enrollment_number: d?.enrollment_number || '',
          password: '',
        })
      } catch (err) {
        handleerror(err?.response?.data?.message || err?.message || 'Failed to load student')
      }
    }
    fetchStudent()
  }, [isEdit, id])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSave = async () => {
    if (!form.enrollment_number) {
      handleerror('Enrollment Number is required')
      return
    }
    try {
      setSaving(true)

      // Create FormData for multipart/form-data request (only two fields)
      const formData = new FormData()
      formData.append('enrollment_number', form.enrollment_number)
      formData.append('password', form.password || '')

      // Call API
      let response
      if (isEdit) {
        response = await axios.put(`${BACKEND_API_URL}/studentm/edit_student/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        response = await axios.post(`${BACKEND_API_URL}/studentm/create_student`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      handlesuccess(response.data?.message || (isEdit ? 'Student updated successfully' : 'Student created successfully'))

      // Reset form
      setForm({ enrollment_number: '', password: '' })
      //navigate to students list
      setTimeout(() => {
        navigate('/Student/list')
      }, 2000);
    } catch (error) {
      console.error('Error creating student:', error)
      handleerror(error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to create student')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`flex min-h-screen flex-col md:flex-row transition-colors duration-300 ${
        resolvedDark ? 'bg-black text-gray-100' : 'bg-[#F5F7FB] text-[#0F172A]'
      }`}
    >
      {/* Left: INAI logo */}
      <div className="flex w-full items-center justify-center py-8 md:py-0 md:flex-1">
        <img
          src={getAsset(resolvedDark ? 'inailogo_dark' : 'inailogo_light')}
          alt="INAI Logo"
          className="max-w-xs w-56 lg:w-72 object-contain"
        />
      </div>

      {/* Right: Credentials card */}
      <div className="flex w-full items-center justify-center px-6 pb-10 md:pb-0 md:px-10 md:flex-1">
        <div
          className={`w-full max-w-xl rounded-2xl px-8 py-8 md:px-10 md:py-10 shadow-lg ${
            resolvedDark ? 'bg-[#111214] text-gray-100' : 'bg-white text-zinc-900'
          }`}
        >
          <button
            type="button"
            onClick={() => navigate('/Student/Dashboard')}
            className={`mb-4 inline-flex items-center gap-1 text-xs md:text-sm cursor-pointer transition-colors ${
              resolvedDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-black hover:text-zinc-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h2 className="text-xl md:text-2xl font-semibold">Generate Student Credentials</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className={`block text-xs md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-black'}`}>
                Student Enrollment Number
              </label>
              <input
                name="enrollment_number"
                value={form.enrollment_number}
                onChange={onChange}
                placeholder="Enter enrollment number"
                className={inputCls}
              />
            </div>

            <div>
              <label className={`block text-xs md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-black'}`}>
                Set Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Enter password"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center justify-center text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className={`w-40 rounded-md py-2.5 text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-60 ${
                resolvedDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'
              }`}
            >
              {saving ? (isEdit ? 'Saving...' : 'Saving...') : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddStudent
