import React, { useMemo, useState } from 'react'
import Sidebar from '../../Tools/Sidebar'
import Header from '../../Tools/Header'
import { handlesuccess, handleerror, BACKEND_API_URL } from '../../../utils/assets'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
// import {Back }
function AddStudent({ theme, isDark, toggleTheme, sidebardata, title = 'Add Student' }) {
  const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark'
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    enrollment_number: '',
    std: '',
    division: '',
  })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const containerCls = useMemo(() => (
    `w-full p-6 space-y-6 ${resolvedDark ? 'bg-zinc-900 text-gray-200' : 'bg-white text-zinc-800'}`
  ), [resolvedDark])

  const inputCls = `w-full rounded-lg px-3 py-2.5 text-[13px] md:text-sm ${resolvedDark ? 'bg-zinc-800 text-gray-200 placeholder:text-gray-400' : 'bg-zinc-100 text-zinc-900 placeholder:text-zinc-400'}`;

  
  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onPickPhoto = (file) => {
    if (!file) return
    setPhoto(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const onDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) onPickPhoto(file)
  }

  const onBrowse = (e) => {
    const file = e.target.files?.[0]
    if (file) onPickPhoto(file)
  }

  const getToken = () => localStorage.getItem("token") || localStorage.getItem("access_token");

  const onSave = async () => {
    if (!form.first_name || !form.last_name || !form.enrollment_number) {
      handleerror('First Name, Last Name and Enrollment Number are required')
      return
    }
    try {
      setSaving(true)
      const token = getToken();
      if (!token) {
        handleerror('No authentication token found')
        setSaving(false)
        return
      }

      // API call with JSON data
      const response = await axios.post(`${BACKEND_API_URL}/student-management/single`, {
        enrollment_number: form.enrollment_number,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        std: form.std || '',
        division: form.division || ''
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      handlesuccess(response.data?.message || 'Student created successfully')

      // Reset form
      setForm({ first_name: '', middle_name: '', last_name: '', enrollment_number: '', std: '', division: '' })

      //navigate to students list with highlight
      setTimeout(() => {
        navigate('/Student/list', { 
          state: { 
            highlightedEnrollments: [form.enrollment_number] 
          } 
        })
      }, 500);
    } catch (error) {
      console.error('Error creating student:', error)
      handleerror(error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to create student')
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setForm({ first_name: '', middle_name: '', last_name: '', enrollment_number: '', std: '', division: '' })
    navigate('/Student/Add')
  }

  return (
    <div className={`flex ${resolvedDark ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-50 text-zinc-900'} h-screen transition-colors duration-300`}>
      <Sidebar isDark={resolvedDark} sidebardata={sidebardata} />
      <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full md:ml-[60px] lg:ml-72 p-2 md:p-7 transition-all duration-300`}>
        <div className="sticky top-0 z-20">
          <Header title={title} isDark={resolvedDark} toggleTheme={toggleTheme} />
        </div>

        <main className={`mt-6 flex-1 min-h-0 overflow-hidden ${resolvedDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
          <div className={`${containerCls} flex flex-col overflow-hidden flex-1 min-h-0`}>
            <div className={`flex items-center justify-between pb-4 m-0 shrink-0 border-b ${resolvedDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
              <h2
                className={`
    text-base
    font-medium
    leading-none
    tracking-normal
    capitalize
    font-sans
    ${resolvedDark ? 'text-gray-200' : 'text-[#696CFF]'}
  `}
              >
                Add Student
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className={`${resolvedDark ? 'bg-zinc-900 text-gray-300 hover:bg-zinc-800 border border-gray-300' : 'bg-gray-100 text-zinc-800 hover:bg-gray-200 shadow-sm'} inline-flex items-center justify-center rounded-md px-4 py-2 text-sm cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={onSave}
                  className={`${resolvedDark ? 'bg-white text-zinc-800 hover:opacity-90' : 'bg-[#696CFF] text-white hover:bg-[#575BFF] shadow-sm'} rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60 cursor-pointer`}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="mt-5 flex-1 min-h-0 overflow-y-auto no-scrollbar max-h-[calc(100vh-250px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>First Name</label>
                  <input name="first_name" value={form.first_name} onChange={onChange} placeholder="Enter First Name" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Middle Name</label>
                  <input name="middle_name" value={form.middle_name} onChange={onChange} placeholder="Enter Middle Name" className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Last Name</label>
                  <input name="last_name" value={form.last_name} onChange={onChange} placeholder="Enter Last Name" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Class (STD)</label>
                  <input name="std" value={form.std} onChange={onChange} placeholder="Enter Class" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Division</label>
                  <input name="division" value={form.division} onChange={onChange} placeholder="Enter Division" className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Enrollment Number</label>
                  <input name="enrollment_number" value={form.enrollment_number} onChange={onChange} placeholder="Enter Enrollment Number" className={inputCls} />
                </div>
              </div>
            </div>
          </div>


        </main>
      </div>
    </div>
  )
}

export default AddStudent
