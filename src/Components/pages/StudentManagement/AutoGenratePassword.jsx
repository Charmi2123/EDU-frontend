import React, { useEffect, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { handleerror, handlesuccess } from "../../../utils/assets.js";
import { FileSpreadsheet, UploadCloud, Info, Download, FileUp, UserPlus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BACKEND_API_URL } from "../../../utils/assets.js";
import { useNavigate } from "react-router-dom";
function AutoGenratePassword({ theme, isDark, toggleTheme, sidebardata }) {
  const navigate = useNavigate();
  const resolvedDark = typeof isDark === "boolean" ? isDark : theme === "dark";
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleClose = () => {
    navigate("/Student/Dashboard");
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleFileSelect = (selected, resetInput) => {
    if (!selected) return;

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx') {
      handleerror("Please upload an Excel file (.xlsx only)");
      if (resetInput) {
        resetInput();
      }
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const onSelectFile = (event) => {
    const selected = event.target.files?.[0];
    handleFileSelect(selected, () => {
      event.target.value = '';
    });
  };

  const triggerFilePicker = () => {
    const input = document.getElementById("excel-upload-input");
    if (input) {
      input.click();
    }
  };

  const handleTemplateDownload = async () => {
    try {
      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Define only the headers
      const data = [
        ['Enrollment Number', 'First Name', 'Middle Name', 'Last Name', 'Std', 'Div']
      ];

      // Set column widths for better visibility
      const colWidths = [
        { wch: 20 }, // Enrollment Number
        { wch: 15 }, // First Name
        { wch: 15 }, // Middle Name
        { wch: 15 }, // Last Name
        { wch: 5 },  // Std
        { wch: 5 }   // Div
      ];

      // Create worksheet from array of arrays
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      ws['!cols'] = colWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Students');

      // Generate Excel file and trigger download
      const fileName = 'Add_Student.xlsx';
      XLSX.writeFile(wb, fileName);

      handlesuccess("Template downloaded successfully!");
    } catch (error) {
      handleerror("Failed to generate template: " + error.message);
    }
  };


  const handleSubmit = async () => {
    if (!file) {
      handleerror("Please select an Excel file to upload.");
      return;
    }

    let enrollmentNumbers = [];

    try {
      setSubmitting(true);

      // Parse the Excel file to extract enrollment numbers
      const reader = new FileReader();
      await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Extract enrollment numbers from the first column (skip header)
            enrollmentNumbers = jsonData
              .slice(1) // Skip header row
              .filter(row => row[0]) // Filter out empty rows
              .map(row => String(row[0]).trim()); // Get enrollment number from first column
            
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      // Get access_token directly from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found. Please log in again.');
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);

      // Make the API request
      const response = await fetch(`${BACKEND_API_URL}/student-management/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.detail === "No rows found in Excel") {
          throw new Error('No rows found in Excel');
        }
        throw new Error(errorData.message || errorData.detail || 'Failed to upload file');
      }
      const result = await response.json();
      handlesuccess(result.message || 'File uploaded successfully!');

      // Navigate to student list with highlighted enrollment numbers
      setTimeout(() => {
        if (enrollmentNumbers.length > 0) {
          navigate('/Student/list', { 
            state: { 
              highlightedEnrollments: enrollmentNumbers 
            } 
          });
        } else {
          navigate('/Student/list');
        }
      }, 1500);

      // Reset the file input
      const fileInput = document.getElementById('excel-upload-input');
      if (fileInput) fileInput.value = '';
      setFile(null);

    } catch (err) {
      console.error('Upload error:', err);
      handleerror(err.message || "Failed to upload file. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pageClasses = resolvedDark
    ? "bg-zinc-950 text-gray-100"
    : "bg-zinc-50 text-zinc-900";

  const cardClasses = resolvedDark
    ? "bg-zinc-900 border-zinc-800"
    : "bg-white border-zinc-200";

  const subtleText = resolvedDark ? "text-gray-400" : "text-zinc-500";

  return (
    <div className={`flex h-screen transition-colors duration-300 ${pageClasses}`}>
      <Sidebar isDark={resolvedDark} sidebardata={sidebardata} />

      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300">
        <div className="sticky top-0 z-20">
          <Header
            title="Student Management"
            isDark={resolvedDark}
            toggleTheme={toggleTheme}
          />
        </div>

        <main className="mt-2 flex-1 overflow-y-auto no-scrollbar flex items-center justify-center">
          <div
            className={`w-full max-w-xl rounded-2xl px-6 py-10 ${cardClasses}`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={handleClose}
                className={`absolute right-0 top-0 inline-flex items-center justify-center rounded-md p-2 transition-colors cursor-pointer ${resolvedDark
                  ? "text-gray-300 hover:bg-zinc-800 hover:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                aria-label="Close"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${resolvedDark ? "bg-zinc-800" : "bg-zinc-100"
                  }`}
              >
                <FileSpreadsheet
                  className={resolvedDark ? "text-white" : "text-zinc-800"}
                  size={24}
                />
              </div>
              <h1 className="text-lg md:text-xl font-semibold">Excel File Upload</h1>
              <p className={`text-xs ${subtleText}`}>
                Upload your student data file to generate auto-passwords.
              </p>
            </div>

            <div className="mt-2 space-y-3 items-center">
              <button
                type="button"
                onClick={handleTemplateDownload}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${resolvedDark
                  ? "bg-zinc-900 border-zinc-700 text-gray-100 hover:bg-zinc-800"
                  : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50"
                  }`}
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>

              <div
                onClick={triggerFilePicker}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  handleFileSelect(droppedFile);
                }}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors ${resolvedDark
                  ? "bg-zinc-950/40 hover:bg-zinc-900/60 border-zinc-700 hover:border-zinc-500"
                  : "bg-zinc-50 hover:bg-zinc-100 border-zinc-300 hover:border-zinc-400"
                  } ${isDragging
                    ? resolvedDark
                      ? 'border-blue-500 bg-zinc-900/60'
                      : 'border-blue-500 bg-blue-50'
                    : ''
                  }`}
              >
                <UploadCloud
                  className={resolvedDark ? "text-gray-200" : "text-zinc-700"}
                  size={24}
                />
                <p className="text-[11px] font-medium">
                  {file ? file.name : "Click to upload Excel file"}
                </p>
                <p className={`text-[10px] ${subtleText}`}>
                  Only .xlsx files are supported
                </p>
                <input
                  id="excel-upload-input"
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={onSelectFile}
                />
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl px-3 py-2 text-xs ${resolvedDark
                  ? "bg-zinc-900 border border-zinc-800"
                  : "bg-zinc-100 border border-zinc-200"
                  }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${resolvedDark
                    ? "border-zinc-600 text-gray-300"
                    : "border-zinc-400 text-zinc-700"
                    }`}
                >
                  <Info className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-semibold">Auto-password format:</div>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li>First 4 letters of name + last 4 digits of enrollment</li>
                    <li>
                      Example: <span className="font-mono">Ravi1234</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold cursor-pointer disabled:opacity-60 ${resolvedDark
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "bg-[#696CFF] text-white hover:bg-[#575BFF]"
                  }`}
              >
                <FileUp className="w-4 h-4" />
                <span>{submitting ? "Submitting..." : "Submit File"}</span>
              </button>
            </div>
            {/* Add Student Section */}
            <div className="mt-4 flex flex-col items-center justify-center gap-2">
              <p className={`text-sm ${resolvedDark ? "text-blue-400" : "text-blue-600"}`}>
                Manually add an individual student.
              </p>
              <button
                type="button"
                onClick={() => navigate('/Student/Manulyadd')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold cursor-pointer transition-colors ${resolvedDark
                  ? "border border-blue-400 text-blue-400 hover:bg-white hover:text-black"
                  : "border border-blue-600 text-blue-600 hover:bg-[#575BFF] hover:text-white"
                  }`}
              >
                Add Student
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AutoGenratePassword;
