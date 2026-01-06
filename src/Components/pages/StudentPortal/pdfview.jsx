import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText } from 'lucide-react';
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from 'axios';

// Dynamically import PDF.js for page count detection
const loadPDFJS = async () => {
  if (typeof window !== 'undefined' && !window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);
    
    return new Promise((resolve) => {
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
    });
  }
};

export default function PDFSlideViewer({ theme, isDark, toggleTheme, sidebardata }) {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(150); // Set actual page count
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [userInput, setUserInput] = useState('1');
  const [error, setError] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('continuous'); // 'single' or 'continuous'
  const [pdfNotFound, setPdfNotFound] = useState(false);

  // Get book ID from navigation state
  const bookId = location.state?.bookId;

  // Fetch book data by ID
  useEffect(() => {
    const fetchBookById = async () => {
      if (!bookId) {
        // If no bookId, use fallback PDF
        setBookData({
          pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
          title: "PDF Viewer",
          totalPages: 150
        });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Student token not found in localStorage");
        setBookData({
          pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
          title: "PDF Viewer",
          totalPages: 150
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch all books and find the one with matching ID
        const res = await axios.get(`${BACKEND_API_URL}/school-portal/books`, {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data || {};
        let booksList = [];

        if (Array.isArray(data)) {
          booksList = data;
        } else if (data.data && Array.isArray(data.data.books)) {
          booksList = data.data.books;
        } else if (Array.isArray(data.data)) {
          booksList = data.data;
        } else if (Array.isArray(data.books)) {
          booksList = data.books;
        }

        // Find the specific book by ID
        const specificBook = booksList.find(book => book.id === bookId);
        
        if (specificBook) {
          console.log('Found book:', specificBook);
          setBookData({
            pdfUrl: specificBook.file_url?.startsWith('/https://') 
              ? specificBook.file_url.replace(/^\//, '') // Remove leading slash for URLs like /https://...
              : specificBook.file_url?.startsWith('http') 
                ? specificBook.file_url 
                : `${BACKEND_API_URL}${specificBook.file_url}`,
            title: specificBook.title,
            totalPages: 150
          });
        } else {
          console.log('Book not found, using fallback PDF');
          setBookData({
            pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
            title: "PDF Viewer",
            totalPages: 150
          });
        }
      } catch (error) {
        console.error('Failed to fetch book data:', error);
        // Set fallback PDF on error
        setBookData({
          pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
          title: "PDF Viewer",
          totalPages: 150
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookById();
  }, [bookId]);

  // Debug: Log the book data
  console.log('Book ID:', bookId);
  console.log('Book Data:', bookData);

  // If no PDF URL, don't set fallback
  let finalPdfUrl = bookData?.pdfUrl;
  if (finalPdfUrl && finalPdfUrl.includes('192.168.1.53')) {
    // Backend not accessible, use fallback PDF
    finalPdfUrl = "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf";
    console.log('Backend not accessible, using fallback PDF');
  }

  // Debug: Log the final PDF URL being used
  console.log('Final PDF URL:', finalPdfUrl);

  const pdfFile = finalPdfUrl;

  useEffect(() => {
    // Load PDF and detect page count
    const loadPDFAndDetectPages = async () => {
      try {
        await loadPDFJS();
        
        if (window.pdfjsLib && pdfFile) {
          const loadingTask = window.pdfjsLib.getDocument(pdfFile);
          const pdf = await loadingTask.promise;
          setTotalPages(pdf.numPages);
          console.log(`PDF loaded with ${pdf.numPages} pages`);
          setPdfNotFound(false);
        }
      } catch (error) {
        console.error('Error detecting PDF pages:', error);
        // Check if it's a backend "Not Found" response - if so, don't show error UI
        const isBackendNotFound = error.message && (
          error.message.includes('Not Found') || 
          error.message.includes('404') ||
          error.name === 'InvalidPDFException'
        );
        
        if (isBackendNotFound) {
          console.log('Backend returned Not Found, using fallback PDF silently');
          setPdfNotFound(false); // Ensure error UI is not shown
        } else {
          // For other PDF errors, show the error UI
          setPdfNotFound(true);
          console.log('PDF not found, showing error UI');
        }
        // Fallback to default page count
        setTotalPages(bookData?.totalPages || 150);
      } finally {
        setLoading(false);
        setPdfLoaded(true);
      }
    };

    if (pdfFile) {
      loadPDFAndDetectPages();
    }
  }, [pdfFile, bookData?.totalPages]);

  // Update input field when currentPage changes
  useEffect(() => {
    setUserInput(currentPage.toString());
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      setIframeKey((prev) => prev + 1); // Force iframe reload
    }
  };

  const prevPage = () => {
    setCurrentPage((p) => (p > 1 ? p - 1 : 1));
    if (currentPage > 1) {
      setIframeKey((prev) => prev + 1); // Force iframe reload
    }
  };

  const zoomIn = () => {
    setZoom((z) => Math.min(3, z + 0.2));
  };

  const zoomOut = () => {
    setZoom((z) => Math.max(1, z - 0.2));
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'continuous' : 'single');
    setIframeKey(prev => prev + 1); // Force iframe reload
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePageInput = (e) => {
    const value = e.target.value;
    setUserInput(value);
    
    const page = parseInt(value);
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setIframeKey((prev) => prev + 1); // Force iframe reload
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(userInput);
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setIframeKey((prev) => prev + 1); // Force iframe reload
    } else {
      setUserInput(currentPage.toString());
    }
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(userInput);
      if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setIframeKey((prev) => prev + 1); // Force iframe reload
      } else {
        setUserInput(currentPage.toString());
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') {
        nextPage();
      }
      if (e.key === 'ArrowLeft') {
        prevPage();
      }
      if (e.key === '+' || e.key === '=') {
        zoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        zoomOut();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, zoom]);

  if (loading) {
    return (
      <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
        {/* Conditionally render sidebar based on fullscreen state */}
        {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}
        
        <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'px-0 pb-0' : 'md:ml-15 lg:ml-72 px-0 pb-0'} transition-all duration-300`}>
          <div className="sticky top-0 z-20">
            <Portalheader title={bookData?.title || "PDF Viewer"} isDark={isDark} toggleTheme={toggleTheme} />
          </div>
          <main className={`${isFullscreen ? '' : 'mt-4'} flex-1 flex items-center justify-center min-h-0 p-8`}>
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Loading PDF...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show PDF not found UI if PDF failed to load
  if (pdfNotFound) {
    return (
      <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
        {/* Conditionally render sidebar based on fullscreen state */}
        {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}
        
        <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'px-0 pb-0' : 'md:ml-15 lg:ml-72 px-0 pb-0'} transition-all duration-300`}>
          <div className="sticky top-0 z-20">
            <Portalheader title="PDF Not Found" isDark={isDark} toggleTheme={toggleTheme} />
          </div>
          <main className={`${isFullscreen ? '' : 'mt-4'} flex-1 flex items-center justify-center min-h-0 p-8`}>
            <div className="text-center max-w-md">
              <div className={`w-20 h-20 ${isDark ? 'bg-red-900/20' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <FileText className="w-10 h-10 text-red-500" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                PDF Not Found
              </h2>
              <p className={`${isDark ? 'text-gray-400' : 'text-black'} mb-6`}>
                The PDF file you're looking for could not be loaded. Please check if the file exists or try again later.
              </p>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'} mb-6`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>
                  <strong>File attempted:</strong><br />
                  <span className="text-xs font-mono break-all">{pdfFile}</span>
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className={`px-6 py-2 ${isDark ? 'bg-white hover:bg-gray-100 text-gray-900' : 'bg-[#3498db] hover:bg-purple-700 text-white'} cursor-pointer rounded-lg transition-colors`}
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
      {/* Conditionally render sidebar based on fullscreen state */}
      {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}

      {/* Main Content - Full width when fullscreen, normal when not */}
      <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'px-0 pb-0' : 'md:ml-15 lg:ml-72 px-0 pb-0'} transition-all duration-300`}>
        <div className="sticky top-0 z-20">
          <Portalheader title={bookData?.title || "PDF Viewer"} isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        <main className="flex-1 flex flex-col min-h-0 px-0">
          {/* PDF Viewer - Full Container */}
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <iframe
              key={iframeKey}
              src={`${pdfFile}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&view=FitV`}
              className={`${isDark ? 'bg-black' : 'bg-zinc-100'} no-scrollbar`}
              style={{ 
                width: '100%', 
                height: '100%',
                border: 'none',
                display: 'block',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
              title="PDF Viewer"
            />
          </div>

          
          {/* <div className="absolute bottom-4 left-4 right-4 z-30">
            <div className="backdrop-blur border rounded-lg px-4 py-3 max-w-md mx-auto">
              <div className="flex items-center justify-between gap-3">
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded transition-all"
                    title="Previous (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    value={userInput}
                    onChange={handlePageInput}
                    onBlur={handlePageInputBlur}
                    onKeyPress={handlePageInputKeyPress}
                    className={`w-14 ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'} text-center text-sm rounded px-2 py-1 outline-none border ${isDark ? 'border-zinc-700' : 'border-gray-300'}`}
                    min="1"
                    max={totalPages}
                    placeholder="1"
                  />

                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
                    / {totalPages}
                  </span>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded transition-all"
                    title="Next (→)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                
                <div className="flex items-center gap-2">
                  <button
                    onClick={zoomOut}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="text-white bg-purple-600/70 px-3 py-1 rounded text-sm min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>

                  <button
                    onClick={zoomIn}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleViewMode}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all ml-1"
                    title={`View Mode: ${viewMode === 'single' ? 'Single Page' : 'Continuous Scroll'}`}
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all ml-1"
                    title="Fullscreen (F)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
            <div className={`${isDark ? 'bg-zinc-800/80' : 'bg-gray-800/80'} text-white text-xs px-3 py-1 rounded-full backdrop-blur`}>
              ← → : Navigate | + - : Zoom | F : Fullscreen | Esc : Exit
            </div>
          </div> */}
        </main>
      </div>
    </div>
  );
}
