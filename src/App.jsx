import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getAuthRedirectPath, getAuthRedirectPathAsync, setupTokenRefresh } from './utils/assets'
import AddMembers from './Components/pages/Admin/AddMembers'
import AllMembers from './Components/pages/Admin/AllMembers'
import ChapterManagement from './Components/pages/ChapterManagement/ChapterManagement'
import Notifications from './Components/pages/LecturesManagement/Notifications'
import Login from './Components/pages/Startup/Login'
import ChangePassword from './Components/pages/Startup/ChangePassword'
import Profile from './Components/pages/Profiles/Profile'
import EditProfile from './Components/pages/Profiles/EditProfile'
import ManagementList from './Components/pages/Admin/ManagementList'
import SignUp from './Components/pages/Startup/SignUp'
import AdminDashboard from './Components/pages/Admin/AdminDashboard'
import Playedleacher from './Components/pages/LecturesManagement/Playedleacher'
import SharedLeacher from './Components/pages/LecturesManagement/SharedLeacher'
import AutoGenratePassword from './Components/pages/StudentManagement/AutoGenratePassword'
import StudentsList from './Components/pages/StudentManagement/StudentsList'
import StudentDetails from './Components/pages/StudentManagement/StudentDetails'
import StudentDashboard from './Components/pages/StudentManagement/StudentDashboard'
import TotalLecture from './Components/pages/StudentManagement/TotalLecture'
import TotalPaid from './Components/pages/StudentManagement/TotalPaid'
import LectureHome from './Components/pages/LecturesManagement/LectureHome'
import StartNewLecture from './Components/pages/LecturesManagement/StartNewLecture'
import AddLecture from './Components/pages/LecturesManagement/AddLecture'
import LectureVideo from './Components/pages/LecturesManagement/LectureVideo'
import QwestionAndAnswer from './Components/pages/LecturesManagement/QwestionAndAnswer'
import PortalDetails from './Components/pages/StudentPortal/PortalDetails'
import PortalSignUp from './Components/pages/StudentPortal/PortalSignUp'
import SelectSubject from './Components/pages/StudentPortal/SelectSubject'
import OpenChart from './Components/pages/StudentPortal/OpenChart'
import ChapterTitle from './Components/Trash/ChapterTitle'
import PersonalInformation from './Components/pages/StudentPortal/PersonalInformation'
import Videos from './Components/pages/StudentPortal/Videos'
import EditChapter from './Components/pages/ChapterManagement/EditChapter'
import AddChapter from './Components/pages/ChapterManagement/AddChapter'
import Suggestions from './Components/pages/ChapterManagement/Suggestions'
import UploadBook from './Components/pages/ChapterManagement/UploadBook'
import MergeChapter from './Components/pages/ChapterManagement/MergeChapter'
import NarrationPage from './Components/pages/ChapterManagement/NarrationPage'
import AddTopicNarration from './Components/pages/ChapterManagement/AddTopicNarration'
import PuchaseHistory from './Components/pages/StudentPortal/PuchaseHistory'
import WatchedLeachers from './Components/pages/StudentPortal/WatchedLeachers'
import SavedVideos from './Components/pages/StudentPortal/SavedVideos'
import Chapter from './Components/pages/StudentPortal/Chapter'
import CoverPage from './Components/pages/ChapterManagement/CoverPage'
import Languages from './Components/pages/ChapterManagement/Languages'
import LectureDashboard from './Components/pages/LecturesManagement/LectureDashboard'
import AllChapters from './Components/pages/ChapterManagement/AllChapters'
import GenerateStudent from './Components/pages/StudentManagement/GenerateStudent'
import Settings from './Components/pages/StudentPortal/Settings'
import UpdateStudentDetails from './Components/pages/StudentManagement/UpdateStudentDetails'
import ResetPassword from './Components/pages/Startup/ResetPassword'
import RoleFeatures from './Components/pages/Startup/RoleFeatures'
import PDFSlideViewer from './Components/pages/StudentPortal/pdfview'
import SuperadministrationLogin from './Components/pages/SuperAdmin/SuperadministrationLogin'
import SuperadministrationDashboard from './Components/pages/SuperAdmin/SuperadministrationDashboard'
import AddStudent from './Components/pages/StudentManagement/AddStudent'
import PlayedVideo from './Components/pages/LecturesManagement/PlayedVideo'


function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'light' || stored === 'dark') return stored
    } catch (e) {
      console.error("Theme storage access error:", e);
    }
    // Default to dark theme when no preference is stored
    return 'dark'
  })
  const isDark = useMemo(() => theme === 'dark', [theme])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check for token and redirect if on public pages
    const checkAuthAndRedirect = async () => {
      // List of public paths to redirect FROM if already logged in
      const publicPaths = ['/', '/Intro', '/login', '/signup', '/superadministration/login']

      // Also support redirection from root if it's exact match or if user visits login pages
      const currentPath = location.pathname.toLowerCase()

      const isPublic = publicPaths.some(p => currentPath === p.toLowerCase() || (p !== '/' && currentPath.startsWith(p.toLowerCase())))

      if (isPublic) {
        // Use async version that handles token refresh
        const redirectPath = await getAuthRedirectPathAsync()
        if (redirectPath) {
          navigate(redirectPath, { replace: true })
        }
      }
    }

    checkAuthAndRedirect()
  }, [navigate, location])

  // Setup automatic token refresh
  useEffect(() => {
    const cleanup = setupTokenRefresh();
    return cleanup;
  }, []);

  // // Disable Developer Tools and Right Click
  // useEffect(() => {
  //   const handleContextMenu = (e) => {
  //     e.preventDefault();
  //   };

  //   const handleKeyDown = (e) => {
  //     // F12
  //     if (e.key === 'F12') {
  //       e.preventDefault();
  //     }
  //     // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
  //     if (e.ctrlKey && e.shiftKey && (['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key))) {
  //       e.preventDefault();
  //     }
  //     // Ctrl+U (View Source)
  //     if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
  //       e.preventDefault();
  //     }
  //   };

  //   document.addEventListener('contextmenu', handleContextMenu);
  //   document.addEventListener('keydown', handleKeyDown);

  //   return () => {
  //     document.removeEventListener('contextmenu', handleContextMenu);
  //     document.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, []);

  const lectureSidebar = [
    {
      label: "Dashboard",
      to: "/lecture/Dashboard",
      icon: ["home_tranperent_dark", "home_tranperent_light", "current_home_tranperent_light"]
    },
    {
      label: "All Lectures",
      to: "/lecture/Alllectures",
      activePaths: [
        "/lecture/LectureVideo",
        "/lecture/addlecture",
        "/lecture/newlecture",
        "/lecture/LectureVideo",
      ],
      icon: ["Alllectures_dark", "Alllectures_light", "current_Alllectures_light"]
    },
    {
      label: "Played Lecture",
      to: "/lecture/Playedlecture",
      icon: ["playedleacher_dark", "playedleacher_light", "current_playedleacher_light"]
    },
    {
      label: "Shared Lecture",
      to: "/lecture/Sharedlecture",
      icon: ["share_trap_dark", "share_trap_light", "current_share_trap_light"]
    },
    // {
    //   label: "Q&A Section",
    //   to: "/lecture/QandA",
    //   icon: ["q_dark", "q_light"]
    // }
    // {
    //   label: "Start New Lecture",
    //   to: "/lecture/newlecture",
    //   icon: ["addlecture_dark", "addlecture_light"]
    // },

  ]

  const adminSidebar = [
    {
      label: "Dashboard",
      to: "/Admin/Dashboard",
      icon: ["home_dark", "home_light", "current_home_light"]
    },
    {
      label: "All Members",
      to: "/Admin/AllMembers",
      activePaths: [
        "/Admin/Managementlist",
        "/Admin/AddMembers",
        "/Admin/EditMembers",
        "/Admin/Profile",
        "/Admin/Profile/Edit/:id",
        "/Admin/chapter",
        "/Admin/chapter/Dashboard",
        "/Admin/student/Dashboard",
        "/Admin/lecture/Dashboard",

      ],
      icon: ["filter_dark", "filter_light", "current_filter_light"]
    }
  ]

  const studentSidebar = [
    {
      label: "Dashboard",
      to: "/Student/Dashboard",
      activePaths: [
        "/student/Dashboard",
        "/student/lectures",
        "/student/paid",
        "/student/list",
        "/Student/getdetails",
        "/student/Add",
        "/student/Generatestudent",
        "/Student/Manulyadd",
      ],
      icon: ["home_dark", "home_light", "current_home_light"]
    },
    {
      label: "Generate Student List",
      to: "/Student/Generatestudent",
      icon: ["Generate_student_dark", "Generate_student_light", "current_Generate_student_light"]
    }
  ]

  const chapterSidebar = [
    {
      label: "Home",
      to: "/chapter/Home",
      icon: ["home_dark", "home_light", "current_home_light"]
    },
    {
      label: "Add",
      to: "/chapter/AddChapter",
      activePaths: [
        "/chapter/AddChapter",
        "/chapter/Suggestions",
        "/chapter/UploadBook",
        "/chapter/AddTopics",
        "/chapter/MergeChapter",
        "/chapter/SetChapter",
        "/chapter/AllChapters",
        "/chapter/Narration",
        "/chapter/CoverPage",
      ],
      icon: ["add_student_dark", "add_student_light", "current_add_student_light"]
    }
  ]
  const StudentpoartalSidebar = [
    {
      label: "Home",
      to: "/StudentPortal/home",
      activePaths: [
        "/StudentPortal/Videos",
      ],
      icon: ["home_tranperent_dark", "home_tranperent_light", "current_home_light", "current_home_dark"]
    },
    {
      label: "Book",
      to: "/StudentPortal/chapter",
      icon: ["book_dark", "book_light", "current_book_light", "current_book_dark"]
    },
    {
      label: "Chat",
      to: "/StudentPortal/OpenChart",
      icon: ["chat_dark", "chat_light", "current_chat_light", "current_chat_dark"]
    },
    {
      label: "Watched Lecture",
      to: "/StudentPortal/WatchedLeachers",
      icon: ["video_dark", "video_light", "current_video_light", "current_video_dark"]
    },
    {
      label: "Purchase History",
      to: "/StudentPortal/PuchaseHistory",
      icon: ["puchase_dark", "puchase_light", "current_puchase_light", "current_puchase_dark"]
    },
    {
      label: "Saved Videos",
      to: "/StudentPortal/SavedVideos",
      icon: ["saved_dark", "saved_light", "current_saved_light", "current_saved_dark"]
    },
    {
      label: "Setting",
      to: "/StudentPortal/Settings",
      icon: ["settings_dark", "settings_light", "current_settings_light", "current_settings_dark"]
    },
    {
      label: "Profile",
      to: "/StudentPortal/profile",
      icon: ["profile_dark", "profile_light", "current_profile_light", "current_profile_dark"]
    },

  ]
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <>
      <Routes>
        {/* Login & Auth */}
        <Route path="/login" element={<Login theme={theme} isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/change-password" element={<ChangePassword theme={theme} isDark={isDark} />} />
        <Route path="/signup" element={<SignUp theme={theme} isDark={isDark} />} />
        <Route path="/superadministration/login" element={<SuperadministrationLogin theme={theme} isDark={isDark} />} />
        <Route path="/superadministration/dashboard" element={<SuperadministrationDashboard theme={theme} isDark={isDark} />} />

        {/* Landing */}
        <Route path="/" element={<Navigate to="/Intro" />} />
        <Route path="/Intro" element={<RoleFeatures theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin" element={<Navigate to="/Admin/dashboard" />} />
        <Route path="/Admin/dashboard" element={<AdminDashboard theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/AllMembers" element={<AllMembers theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />

        {/* Admin All Member Pages connected */}
        <Route path="/Admin/Managementlist" element={<ManagementList theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/AddMembers" element={<AddMembers theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/EditMembers" element={<AddMembers theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/Profile" element={<Profile theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/Profile/Edit" element={<EditProfile theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/Notification" element={<Notifications theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/chapter/Dashboard" element={<ChapterManagement theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} addchapter="/Admin/chapter/AddChapter" />} />
        <Route path="/Admin/student/Dashboard" element={<StudentDashboard theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/lecture/Dashboard" element={<LectureDashboard theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/lecture/Allectures" element={<LectureHome theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />
        <Route path="/Admin/reset-password" element={<ResetPassword theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={adminSidebar} />} />

        {/* chapter Management */}
        <Route path="/chapter" element={<Navigate to="/chapter/Home" />} />
        <Route path="/chapter/Home" element={<ChapterManagement theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} addchapter="/chapter/AddChapter" />} />
        {/* <Route path="/chapter/AddChapter" element={<AddChapter theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/Home" />} /> */}
        <Route path="/chapter/AddChapter" element={<AddChapter theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/Home" />} />
        <Route path="/chapter/EditChapter" element={<EditChapter theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/Home" />} />
        <Route path="/chapter/Suggestions" element={<Suggestions theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/AddChapter" />} />
        <Route path="/chapter/UploadBook" element={<UploadBook theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/AddChapter" />} />
        <Route path="/chapter/AddTopics" element={<AddTopicNarration theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto={"/chapter/UploadBook"} />} />
        <Route path="/chapter/MergeChapter" element={<MergeChapter theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/AddTopics" />} />
        <Route path="/chapter/AllChapters" element={<AllChapters theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/MergeChapter" />} />
        <Route path="/chapter/SetChapter" element={<Languages theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/AllChapters" />} />
        <Route path="/chapter/Narration" element={<NarrationPage theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/SetChapter" />} />
        <Route path="/chapter/CoverPage" element={<CoverPage theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/Narration" />} />
        <Route path="/chapter/Notification" element={<Notifications theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/Narration" />} />
        <Route path="/chapter/lecture-priview" element={<LectureVideo theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={chapterSidebar} backto="/chapter/Narration" />} />



        {/* Lecture Management */}
        <Route path="/lecture" element={<Navigate to="/lecture/Dashboard" />} />
        <Route path="/lecture/Notification" element={<Notifications theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/Dashboard" element={<LectureDashboard theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/Alllectures" element={<LectureHome theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/Playedlecture" element={<Playedleacher theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/PlayedVideo" element={<PlayedVideo theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/Sharedlecture" element={<SharedLeacher theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/newlecture" element={<StartNewLecture theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/addlecture" element={<AddLecture theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        <Route path="/lecture/LectureVideo" element={<LectureVideo theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} />
        {/* <Route path="/lecture/QandA" element={<QwestionAndAnswer theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={lectureSidebar} />} /> */}



        {/* Student Management */}
        <Route path="/Student" element={<Navigate to="/Student/Dashboard" />} />
        <Route path="/Student/Dashboard" element={<StudentDashboard theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/Student/lectures" element={<TotalLecture theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/Student/paid" element={<TotalPaid theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/Student/list" element={<StudentsList theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/Student/getdetails" element={<StudentDetails theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/Student/Add" element={<AutoGenratePassword theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/Student/Manulyadd" element={<AddStudent theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />

        <Route path="/Student/Generatestudent" element={<GenerateStudent theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        {/* <Route path="/Student/Edit/:id" element={<AddStudent theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} /> */}
        <Route path="/Student/UpdateStudentDetails" element={<UpdateStudentDetails theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />
        <Route path="/student/Notification" element={<Notifications theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={studentSidebar} />} />


        <Route path="/StudentPortal" element={<Navigate to="/StudentPortal/login" />} />
        <Route path="/StudentPortal/login" element={<PortalSignUp theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/PortalDetails" element={<PortalDetails theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/home" element={<SelectSubject theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/Chapter" element={<Chapter theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/ChapterTitle" element={<ChapterTitle theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/OpenChart" element={<OpenChart theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/WatchedLeachers" element={<WatchedLeachers theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/PuchaseHistory" element={<PuchaseHistory theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/SavedVideos" element={<SavedVideos theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/profile" element={<PersonalInformation theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/Videos" element={<Videos theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/Settings" element={<Settings theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />
        <Route path="/StudentPortal/desplaypdf" element={<PDFSlideViewer theme={theme} isDark={isDark} toggleTheme={toggleTheme} sidebardata={StudentpoartalSidebar} />} />



      </Routes>
      <ToastContainer position="top-center" autoClose={2000} limit={1} stacked theme="dark" />
    </>
  )
}

export default App