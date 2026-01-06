import React, { useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useNavigate } from "react-router-dom";
import { Search, SquarePen, Trash2, Inbox, Copy, ArrowLeft, ChevronDown } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets.js";

const CustomSelect = ({ value, onChange, options, placeholder, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`${isDark
                    ? "bg-zinc-800 border-zinc-700 text-gray-200"
                    : "bg-gray-100 border-zinc-300 text-zinc-800"
                    } w-full rounded-lg border px-4 h-10 cursor-pointer flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-[#696CFF] transition-all`}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && (
                <div className={`absolute z-50 mt-1 w-full rounded-md border shadow-lg max-h-60 overflow-y-auto ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                    }`}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${value === option.value
                                ? "bg-[#696CFF] text-white"
                                : `hover:bg-[#696CFF]/80 hover:text-white ${isDark ? "text-gray-100" : "text-zinc-900"}`
                                }`}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function ManagementList({ theme, isDark, toggleTheme, sidebardata, title = 'Management List', filterLabel = 'Management' }) {
    const [workType, setWorkType] = useState('');
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [adminId, setAdminId] = useState(localStorage.getItem('admin_id'));
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || '';
            const headers = { Authorization: token ? `Bearer ${token}` : undefined };

            let url = `${BACKEND_API_URL}/admin-portal/members`;
            if (workType) {
                let typeParam = workType;
                if (['lecture', 'student', 'chapter'].includes(workType)) {
                    typeParam = `${workType}_management`;
                }
                url += `?work_type=${typeParam}`;
            }

            const res = await axios.get(url, { headers });
            const list = Array.isArray(res.data?.data?.members) ? res.data.data.members : [];
            setRows(list);
        } catch (e) {
            console.error(e);
            handleerror('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('admin_id') || localStorage.getItem('user_id') || '2';
        setAdminId(stored);
    }, []);
    useEffect(() => { fetchMembers(); }, [workType]);

    const getMemberId = (m) => m.member_id ?? m.mid ?? m.id ?? m._id ?? m.aid ?? null;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(m => {
            const name = (m.name || `${m.first_name || ''} ${m.last_name || ''}`).trim().toLowerCase();
            const email = (m.email || m.inai_email || '').toLowerCase();
            const phone = (m.phone_number || '').toLowerCase();
            const matchesSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q);
            return matchesSearch;
        });
    }, [rows, search]);

    const openEdit = (m) => {
        navigate(`/Admin/EditMembers`, { state: { id: m.member_id } });
    };


    const openDeleteDialog = (m) => {
        setMemberToDelete(m);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        const m = memberToDelete;
        const memberId = m ? getMemberId(m) : null;
        if (!memberId) {
            handleerror('Cannot delete: missing member id');
            setIsDeleteDialogOpen(false);
            return;
        }
        try {
            setIsDeleting(true);
            const token = localStorage.getItem('access_token') || '';
            const headers = { Authorization: token ? `Bearer ${token}` : undefined };
            const url = `${BACKEND_API_URL}/admin-portal/members/${encodeURIComponent(adminId)}/${encodeURIComponent(memberId)}`;
            // Optimistic update
            setRows(prev => prev.filter(x => getMemberId(x) !== memberId));
            const response = await axios.delete(url, { headers });
            handlesuccess(response.data?.message || 'Member deleted');
            fetchMembers();
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Failed to delete member';
            handleerror(msg);
            fetchMembers();
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setMemberToDelete(null);
        }
    };

    return (
        <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-50 text-zinc-900'} h-screen transition-colors duration-300`}>
            <Sidebar isDark={isDark} sidebardata={sidebardata} />
            <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 transition-all duration-300`}>
                <div className="sticky top-0 z-20">
                    <Header title={"All Member"} isDark={isDark} toggleTheme={toggleTheme} searchValue={search} setSearchValue={setSearch} isSearchbar={true} />
                </div>

                <main className="mt-6 overflow-y-hidden no-scrollbar pr-1 overflow-x-hidden min-w-0">
                    {/* Filter and actions */}
                    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-5 mb-6`}>
                        <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold mb-3 flex items-center`}>
                            <button
                                onClick={() => navigate("/Admin/AllMembers")}
                                className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <span className={`${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                {title}
                            </span>
                        </div>
                        <div className={`${isDark ? 'text-gray-300' : 'text-zinc-700'} text-sm mb-2`}>{filterLabel}</div>
                        <div className="grid grid-cols-[repeat(1,minmax(0,1fr))_repeat(1,minmax(0,133px))] gap-3 items-center w-full">
                            {/* <div className="relative col-span-1 sm:col-span-2">
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className={`${isDark ? 'bg-zinc-800 text-gray-200 border-zinc-700 placeholder-gray-400' : 'bg-gray-100 text-zinc-800 border-zinc-300 placeholder-zinc-400'} w-full border rounded-lg pl-9 pr-3 py-2 text-sm`} />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                            </div> */}

                            <CustomSelect
                                value={workType}
                                onChange={setWorkType}
                                options={[
                                    { value: "", label: "All Management" },
                                    { value: "chapter", label: "Chapter management" },
                                    { value: "lecture", label: "Lecture management" },
                                    { value: "student", label: "Student management" },
                                ]}
                                placeholder="Select Management"
                                isDark={isDark}
                            />

                            <button
                                onClick={() => navigate('/Admin/AddMembers')}
                                className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#696CFF] text-white'} h-10 rounded-md font-semibold w-full sm:w-auto sm:justify-self-end px-4 cursor-pointer`}
                            >
                                Add Member
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="w-full max-w-full overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl overflow-hidden ${filtered.length > 0 && 'min-w-[760px]'}`}>
                            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                                <table className="w-full text-sm mb-5">
                                    {!loading && filtered.length > 0 && (
                                        <thead className={`${isDark ? 'bg-zinc-800 text-gray-200' : 'bg-gray-100 text-zinc-800'} sticky top-0 z-10`}>
                                            <tr>
                                                <th className="text-left px-4 py-3 font-semibold">Name</th>
                                                <th className="text-left px-4 py-3 font-semibold">Management</th>
                                                <th className="text-left px-4 py-3 font-semibold">Designation</th>
                                                <th className="text-left px-4 py-3 font-semibold">Email</th>
                                                {/* <th className="text-left px-4 py-3 font-semibold">Password</th> */}
                                                <th className="text-left px-4 py-3 font-semibold">Mobile Number</th>
                                                <th className="text-left px-4 py-3 font-semibold"></th>
                                            </tr>
                                        </thead>
                                    )}
                                    <tbody className={`${isDark ? 'divide-y divide-zinc-800/60 text-gray-200' : 'divide-y divide-zinc-200 text-zinc-800'}`}>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-10">
                                                    <div className="flex items-center justify-center gap-3 opacity-80 text-sm">
                                                        <div className={`h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin`} />
                                                        <span>Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12">
                                                    <div className="flex flex-col items-center justify-center text-center">
                                                        <div className={`${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-zinc-100 text-zinc-500'} h-14 w-14 rounded-full flex items-center justify-center mb-4`}>
                                                            <Inbox size={24} />
                                                        </div>
                                                        <div className="text-base font-semibold mb-1">
                                                            {search || workType ? 'No members found' : 'No members yet'}
                                                        </div>
                                                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-600'} text-sm mb-4`}>
                                                            {search || workType ? 'Try adjusting your search or filters.' : 'Add your first member to get started.'}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {search ? (
                                                                <button
                                                                    onClick={() => setSearch('')}
                                                                    className={`${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-200 border border-zinc-700' : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300'} px-3 py-1.5 rounded-md text-sm`}
                                                                >
                                                                    Clear search
                                                                </button>
                                                            ) : null}
                                                            {workType ? (
                                                                <button
                                                                    onClick={() => setWorkType('')}
                                                                    className={`${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-200 border border-zinc-700' : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300'} px-3 py-1.5 rounded-md text-sm`}
                                                                >
                                                                    Clear filter
                                                                </button>
                                                            ) : null}
                                                            <button
                                                                onClick={() => navigate('/Admin/AddMembers')}
                                                                className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#696CFF] text-white hover:bg-[#3134f4]'} px-3 py-1.5 rounded-md text-sm font-semibold cursor-pointer`}
                                                            >
                                                                Add Member
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((m, i) => (
                                                <tr key={i} className={`${isDark ? 'hover:bg-zinc-900' : 'hover:bg-zinc-50'}`}>
                                                    <td className="px-4 py-3">{m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim()}</td>
                                                    <td className="px-4 py-3 capitalize">{m.work_type || '-'}</td>
                                                    <td className="px-4 py-3">{m.designation || '-'}</td>
                                                    <td className="px-4 py-3">{m.email || m.inai_email || '-'}</td>
                                                    {/* <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 group">
                                                            <span className="font-mono text-xs">{m.password || '••••••••'}</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(m.password || '');
                                                                    handlesuccess("Password copied");
                                                                }}
                                                                className={`transition-opacity cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                                                                title="Copy Password"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        </div>
                                                    </td> */}
                                                    <td className="px-4 py-3">{m.phone_number || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <button title="Edit" onClick={() => openEdit(m)} className={`${isDark ? 'hover:text-white' : 'hover:text-zinc-900'} text-zinc-400 transition cursor-pointer`}>
                                                                <SquarePen size={16} />
                                                            </button>
                                                            <button title="Delete" onClick={() => openDeleteDialog(m)} className={`${isDark ? 'hover:text-white' : 'hover:text-zinc-900'} text-zinc-400 transition cursor-pointer`}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>

                {isDeleteDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-lg">
                        <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl px-8 py-6 space-y-4 ${isDark ? 'bg-[#222222] text-white' : 'bg-white text-zinc-900'}`}>
                            <h3 className="text-lg font-semibold">Confirm Delete</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-600'}`}>Are you sure you want to delete this member?</p>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { if (!isDeleting) { setIsDeleteDialogOpen(false); setMemberToDelete(null); } }}
                                    disabled={isDeleting}
                                    className={`px-5 py-2 rounded-md cursor-pointer text-sm bg-transparent border transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${isDark ? 'border-gray-500 text-gray-200 hover:bg-gray-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2 rounded-md text-sm cursor-pointer bg-red-600 text-white hover:bg-red-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
}

export default ManagementList;


