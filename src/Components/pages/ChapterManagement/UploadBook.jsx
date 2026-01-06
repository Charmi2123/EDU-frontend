import React, { useRef, useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { RotateCcw, X, ChevronDown, ChevronUp, CloudUpload, ArrowLeft, FileText, Trash2, Check } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets";

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function UploadBook({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, suggestion = true, backto }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  // Read navigation state coming from AddChapter / Suggestions
  const location = useLocation();
  const navState = location.state || {};
  const navigate = useNavigate();

  const selectedIds = Array.isArray(navState.selectedIds) ? navState.selectedIds : [];
  const formData = navState.form || {}; // Extract form data from navigation state

  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUploadedFile, setHasUploadedFile] = useState(false); // Track if file was uploaded successfully
  const [uploadedMaterialIds, setUploadedMaterialIds] = useState([]); // Store uploaded material IDs
  const [uploadProgress, setUploadProgress] = useState(0);

  // Decide whether to show suggestions:
  // 1) If navigation provided its own suggestion flag, always respect that.
  // 2) If file was uploaded successfully, treat as suggestion true
  // 3) Else if there are selectedIds, treat suggestion as true.
  // 4) Else fall back to the suggestion prop.
  const [effectiveSuggestion, setEffectiveSuggestion] = useState(() => {
    if (Object.prototype.hasOwnProperty.call(navState, "suggestion")) {
      return Boolean(navState.suggestion);
    }
    if (selectedIds.length > 0) {
      return true; // Show suggestions when there are selectedIds
    }
    return Boolean(suggestion);
  });

  const shouldShowAddBook = () => !effectiveSuggestion && selectedIds.length === 0 && !hasUploadedFile;

  const [recentBooks, setRecentBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const fileInputRef = useRef(null);
  const hasFetchedRecentBooks = useRef(false);
  const lastSelectedIdsKey = useRef(null);

  // Handle PDF upload to backend
  const handleUploadPDF = async () => {
    if (!uploadedFile) {
      console.error('No file selected');
      return;
    }

    if (!formData.class_name || !formData.subject_name || !formData.chapter_name) {
      console.error('Missing form data');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('access_token');

      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('std', formData.class_name);
      uploadFormData.append('subject', formData.subject_name);
      uploadFormData.append('chapter_number', formData.chapter_name);
      uploadFormData.append('pdf_file', uploadedFile);

      console.log('Uploading PDF with data:', {
        std: formData.class_name,
        subject: formData.subject_name,
        chapter_number: formData.chapter_name,
        fileName: uploadedFile.name
      });

      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/upload`,
        uploadFormData,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type, let axios set it with boundary for FormData
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      if (response.status === 200) {
        handlesuccess(response?.data?.message || "Uploaded Successfully")
      }


      if (response.data && response.data.status) {
        console.log('PDF uploaded successfully!');

        // Extract material ID from response
        const materialId = response.data.data?.material?.id;
        if (materialId) {
          console.log('Saved material ID:', materialId);
          setUploadedMaterialIds([materialId]);
        }

        // Mark file as uploaded and set suggestion to true
        setHasUploadedFile(true);
        setEffectiveSuggestion(true);

        // Navigate to AddTopics page with material ID
        navigate("/chapter/AddTopics", {
          state: {
            materialIds: [materialId],
            form: formData
          }
        });
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsUploading(false);
      fetchRecentBooks();
    }
  };

  // Always fetch recent chapter materials on component mount
  const fetchRecentBooks = async () => {
    setIsLoadingBooks(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Fetching recent books...');
      const response = await axios.get(`${BACKEND_API_URL}/chapter-materials/recent`, {
        headers
      });

      console.log('Recent books API Response:', response.data);

      if (response.data && response.data.status && response.data.data && response.data.data.materials) {
        const materials = response.data.data.materials;

        console.log('Recent materials found:', materials.length);

        // Transform API data to match the UI structure
        const transformedBooks = materials.map((material) => ({
          id: material.id,
          title: material.file_name || "Untitled",
          author: `Class ${material.std} - ${material.subject}`,
          chapters: parseInt(material.chapter_number) || 0,
          filePath: material.file_path,
          fileSize: material.file_size,
          createdAt: material.created_at,
          std: material.std,
          subject: material.subject,
          sem: material.sem,
          board: material.board
        }));

        console.log('Transformed recent books:', transformedBooks);
        setRecentBooks(transformedBooks);
      }
      setIsLoadingBooks(false);
    } catch (error) {
      console.error('Error fetching recent books:', error);
      setRecentBooks([]);
      setIsLoadingBooks(false);
    }
  };
  useEffect(() => {
    fetchRecentBooks();
  }, []);

  // Fetch selected chapters when selectedIds are passed
  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) {
      return;
    }

    const key = JSON.stringify(selectedIds);
    if (lastSelectedIdsKey.current === key) return;
    lastSelectedIdsKey.current = key;

    const fetchSelectedChapters = async () => {
      setIsLoadingBooks(true);
      try {
        const token = localStorage.getItem('access_token');
        const headers = {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('Fetching selected chapters with IDs:', selectedIds);
        const response = await axios.post(
          `${BACKEND_API_URL}/chapter-materials/select-multiple-chapters`,
          {
            selected_ids: selectedIds
          },
          { headers }
        );

        if (response.status === 200) {
          handlesuccess(response?.data?.message || "Successfully selected chapters")
        }


        if (response.data && response.data.status && response.data.data) {
          const materials = response.data.data.materials || response.data.data.chapters || [];

          const transformedBooks = materials.map((material) => ({
            id: material.id,
            title: material.file_name || material.chapter_name || "Untitled",
            author: `Class ${material.std} - ${material.subject}`,
            chapters: parseInt(material.chapter_number) || 0,
            filePath: material.file_path,
            fileSize: material.file_size,
            createdAt: material.created_at,
            std: material.std,
            subject: material.subject,
            sem: material.sem,
            board: material.board
          }));

          console.log('Transformed selected books:', transformedBooks);
          setRecentBooks(transformedBooks);
        }
      } catch (error) {
        console.error('Error fetching selected chapters:', error);
        setRecentBooks([]);
      } finally {
        setIsLoadingBooks(false);
      }
    };

    fetchSelectedChapters();
  }, [selectedIds]);


  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      handleerror("File size exceeds 50MB limit.");
      e.target.value = "";
      return;
    }

    // Future me yahi par API call karke chapter title/topics generate kar sakte ho
    setUploadedFile(file);

    // reset input so same file ko bhi dubara choose kar sake
    e.target.value = "";
  };

  return (
    <div
      className={`flex ${isDark ? "bg-black text-gray-100" : "bg-[#F5F5F9] text-zinc-900"
        } h-screen overflow-hidden transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-hidden">
          <div className="w-full mx-auto h-full flex flex-col space-y-4">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} sticky top-0 z-30 border border-transparent rounded-lg px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>
                <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-md font-semibold flex items-center`}>
                  <button
                    onClick={() => navigate(-1)}
                    className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                    Upload Chapter
                  </h2>
                </div>
              </div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <button
                  onClick={() => navigate(backto)}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Check if PDF is required but not uploaded
                    if (!effectiveSuggestion && !uploadedFile) {
                      handleerror?.("Please upload a PDF file to proceed");
                      return;
                    }
                    
                    // If file is uploaded and suggestion is false, upload the PDF
                    if (uploadedFile && !effectiveSuggestion) {
                      handleUploadPDF();
                    } else {
                      // Navigate to AddTopics with selected IDs if available
                      navigate("/chapter/AddTopics", {
                        state: {
                          selectedIds: selectedIds,
                          form: formData
                        }
                      });
                    }
                  }}
                  disabled={isUploading}
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUploading ? 'Uploading...' : 'Next'}
                </button>
              </div>
            </div>

            {/* Upload Chapter content panel */}
            <div
              className={`rounded-2xl mb-2 border border-transparent px-5 sm:px-7 py-5 sm:py-6 transition-colors duration-300 ${isDark ? "bg-zinc-900" : "bg-white"
                }`}
            >
              {/* Heading + description */}
              <div className="space-y-1 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold">Upload Chapter</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Add a new chapter to your library with chapters
                </p>
              </div>

              {/* Hidden file input for chapter upload */}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Add Book button */}
              {shouldShowAddBook() && (
                <div className="mb-6 flex flex-col gap-2">
                  {!uploadedFile && (
                    <div
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className={`cursor-pointer border-2 border-dashed rounded-xl px-6 py-12 flex flex-col items-center justify-center gap-3 transition-colors ${isDark
                        ? "border-zinc-700 hover:border-zinc-600 bg-zinc-900/30"
                        : "border-[#696CFF] hover:border-[#696CFF]/80 bg-zinc-50/50"
                        }`}
                    >
                      {/* Upload Icon */}
                      <CloudUpload className="text-[#696CFF] w-8 h-8 mb-2" />

                      {/* Text */}
                      <div className="text-center">
                        <p className="text-sm">
                          <span className="text-[#696CFF] font-medium">Click to upload</span>
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}> or drag and drop PDF</span>
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          (Max 50MB)
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadedFile && (
                    <div className="w-full">
                      {!isUploading ? (
                        // Static File Card View (Image 1 Style)
                        <div className={`relative group flex items-center p-4 rounded-xl border transition-all duration-200 ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-[#ecebf1] hover:border-[#696CFF]"
                          }`}>
                          {/* File Icon */}
                          <div className={`shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${isDark ? "bg-[#352e18]" : "bg-[#FFF4D6]"
                            }`}>
                            <FileText className={`w-6 h-6 ${isDark ? "text-[#ffd454]" : "text-[#FFB400]"}`} />
                          </div>

                          {/* Content */}
                          <div className="ml-4 flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? "text-gray-100" : "text-[#141522]"
                              }`}>
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatBytes(uploadedFile.size)} • PDF
                            </p>
                          </div>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => setUploadedFile(null)}
                            className={`ml-4 p-2 rounded-full transition-colors cursor-pointer ${isDark
                              ? "hover:bg-zinc-700 text-gray-400 hover:text-red-400"
                              : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                              }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        // Progress/Uploading View (Image 2 Style)
                        <div className={`relative p-4 rounded-xl border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-[#ecebf1]"
                          }`}>
                          <div className="flex items-start gap-4">
                            {/* Thumbnail with Check overlay */}
                            <div className="relative">
                              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isDark ? "bg-[#352e18]" : "bg-[#FFF4D6]"
                                }`}>
                                <FileText className={`w-6 h-6 ${isDark ? "text-[#ffd454]" : "text-[#FFB400]"}`} />
                              </div>
                              {/* Success Check Overlay */}
                              {uploadProgress === 100 && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white dark:border-zinc-800">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Header Row */}
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-sm font-medium truncate ${isDark ? "text-gray-100" : "text-[#141522]"
                                  }`}>
                                  {uploadedFile.name}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"
                                    }`}>
                                    {uploadProgress}%
                                  </span>
                                  <button
                                    type="button"
                                    // onClick={() =>  cancel upload logic if needed }
                                    className={`cursor-pointer ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Size info */}
                              <p className="text-xs text-gray-400 mb-3">
                                {formatBytes(uploadedFile.size)}
                              </p>

                              {/* Progress Bar */}
                              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-zinc-700" : "bg-gray-100"
                                }`}>
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recently added section */}
              <div className="space-y-3 flex flex-col">
                <div className="text-xs sm:text-sm text-gray-400">
                  Recently Added Chapters
                </div>

                <div className="space-y-3 pr-1 pb-16 max-h-80 md:max-h-72 overflow-y-auto no-scrollbar">
                  {isLoadingBooks ? (
                    <div className={`rounded-md px-4 py-3 text-center text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-zinc-500"
                      }`}>
                      Loading recent Chapters...
                    </div>
                  ) : recentBooks.length === 0 ? (
                    <div className={`rounded-md px-4 py-3 text-center text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-zinc-500"
                      }`}>
                      No recent Chapters found
                    </div>
                  ) : (
                    <>
                      {recentBooks.map((book) => (
                        <div
                          key={book.id}
                          className={`rounded-md px-4 py-3 flex flex-col gap-1 text-xs sm:text-sm ${isDark
                            ? "bg-zinc-800 border text-gray-100"
                            : "bg-[#F5F5F9] text-zinc-900"
                            } border border-transparent`}
                        >
                          <div className="font-medium">
                            {book.title}
                          </div>
                          <div className="text-[11px] sm:text-xs text-gray-400">
                            {book.author} ( {book.chapters} Chapters )
                          </div>
                        </div>
                      ))}
                      <div className="h-6 shrink-0" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UploadBook;
