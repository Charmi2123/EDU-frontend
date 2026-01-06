
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";

function TotalPaid({ isDark, toggleTheme, sidebardata }) {
  const navigate = useNavigate();
  const [lectureData] = useState([
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 2999,
      status: "Completed",
      details: "View Details",
    },
    {
      studentName: "John Carter",
      date: "9/25/2025",
      timeDuration: "9:02:55",
      transactionType: "Course Purchase",
      amount: 29,
      status: "Completed",
      details: "View Details",
    },
  ]);

  // Pagination (dynamic)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalRows = lectureData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIndex = totalRows === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalRows);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageEnd = pageStart + rowsPerPage;
  const paginatedData = lectureData.slice(pageStart, pageEnd);

  // Row classes (theme-aware)
  const oddRowClass = isDark ? "bg-zinc-900" : "bg-white";
  const evenRowClass = isDark ? "bg-zinc-800" : "bg-zinc-50";
  const hoverClass = isDark ? "hover:bg-zinc-700" : "hover:bg-zinc-100";

  return (
    <div
      className={`flex h-screen overflow-y-auto overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
        }`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Total Paid" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} />
        </div>

        {/* Main Content */}
        <main
          className={`mt-6 flex-1 min-w-0 overflow-y-auto transition-colors duration-300 ${isDark ? "bg-black" : "bg-zinc-50"
            }`}
        >
          <div
            className={`flex flex-col h-full ${isDark ? "bg-black text-gray-200" : "bg-white text-zinc-800"
              }`}
          >
            {/* Table container matching Purchase List design */}
            <div
              className={`w-full max-w-none min-h-0 rounded overflow-hidden transition-colors duration-300 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                } border`}
            >
              <div className="flex items-center gap-2 p-4">
                <button
                  onClick={() => navigate('/Student/Dashboard')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-gray-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2
                  className={`text-[22px] font-medium leading-none tracking-normal capitalize ${isDark ? 'text-gray-100' : 'text-black'
                    }`}
                >
                  Purchase List
                </h2>
              </div>


              {/* Table Scroll Area - match TotalLecture style */}
              <div className="p-6 pt-0 max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-auto no-scrollbar">
                <table className="min-w-full table-fixed">
                  <thead
                    className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'
                      } text-left text-xs md:text-sm font-semibold sticky top-0 z-10`}
                  >
                    <tr className="align-middle">
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Student Name</th>
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Date</th>
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Time Duration</th>
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Transaction Type</th>
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Amount</th>
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Status</th>
                      <th className="px-7 py-2 whitespace-nowrap align-middle">Details</th>
                    </tr>
                  </thead>

                  <tbody
                    className={`divide-y ${isDark ? 'divide-zinc-800 text-gray-300' : 'divide-zinc-200 text-zinc-700'
                      } text-xs md:text-sm font-normal`}
                  >
                    {paginatedData.map((row, index) => (
                      <tr
                        key={index}
                        className={`${index % 2 === 1 ? oddRowClass : evenRowClass} ${hoverClass} transition-colors duration-150`}
                      >
                        <td className="px-6 py-3 whitespace-nowrap">{row.studentName}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.date}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.timeDuration}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.transactionType}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          ₹{row.amount.toLocaleString('en-IN')}
                        </td>
                        <td
                          className="px-6 py-3 whitespace-nowrap font-medium text-[#08FF08]"
                        >
                          {row.status}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-xs md:text-sm cursor-pointer underline-offset-2">
                          {row.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center w-full max-w-none mb-2 text-sm p-1">
              <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                {startIndex}-{endIndex} of {totalRows}
              </span>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                  <span>Rows per page:</span>
                  <div className="relative inline-block">
                    <select
                      className={`cursor-pointer appearance-none border rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-1 ${isDark
                          ? "bg-black border-zinc-700 text-white focus:ring-blue-500"
                          : "bg-white border-zinc-300 text-zinc-900 focus:ring-blue-500"
                        }`}
                      value={rowsPerPage}
                      onChange={(e) => {
                        const next = parseInt(e.target.value, 10) || 10;
                        setRowsPerPage(next);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
                  </div>
                </div>

                <div className="flex space-x-2 mr-2">
                  <button
                    className={`p-2 border rounded-md cursor-pointer ${isDark ? 'border-zinc-700 text-gray-400 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'} disabled:opacity-50`}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    className={`p-2 border rounded-md cursor-pointer ${isDark ? 'border-zinc-700 text-gray-400 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'} disabled:opacity-50`}
                    disabled={endIndex >= totalRows}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TotalPaid;
