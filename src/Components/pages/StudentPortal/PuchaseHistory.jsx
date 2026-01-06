import React, { useState } from 'react';

import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { Calendar, Eye, Download, CreditCard, ShoppingBag, TrendingUp, X, Package } from 'lucide-react';

export default function PuchaseHistory({ isDark, toggleTheme, sidebardata }) {
  const shellBg = isDark ? "bg-black text-[#E5E7EB]" : "bg-[#F5F7FB] text-[#0F172A]";
  const panelBg = isDark ? "bg-[#131313] border-zinc-800" : "bg-white border-zinc-200";
  const chipBg = isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700";
  const subText = isDark ? "text-zinc-400" : "text-zinc-600";
  const iconWrap = isDark ? "bg-zinc-800 text-zinc-100" : "bg-white text-blue-600";
  const viewBtn = isDark
    ? "bg-white text-zinc-900 hover:bg-zinc-100"
    : "bg-[#696CFF] text-white hover:bg-indigo-500";

  const [stats] = useState({
    totalSpent: 1798.42,
    totalOrders: 3,
    avgOrderValue: 599.47,
  });

  const [purchaseItems] = useState([
    { id: 1, title: 'Complete Mathematics Course - Class 12', type: 'Course', typeColor: 'bg-red-300', typeTextColor: 'text-black', date: '12/11/25', price: 2999 },
    { id: 2, title: 'Complete Mathematics Course - Class 10', type: 'Chapter', typeColor: 'bg-green-300', typeTextColor: 'text-black', date: '12/11/25', price: 2999 },
    { id: 3, title: 'Complete Mathematics Course - Class 11', type: 'Exam', typeColor: 'bg-blue-300', typeTextColor: 'text-black', date: '12/11/25', price: 3000 },
    { id: 4, title: 'Complete Mathematics Course - Class 13', type: 'Tests', typeColor: 'bg-gray-300', typeTextColor: 'text-black', date: '12/11/25', price: 2999 },
  ]);

  const [activeInvoice, setActiveInvoice] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  // Filter purchase items based on search value
  const filteredItems = purchaseItems.filter(item =>
    item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.type.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.price.toString().includes(searchValue)
  );

  return (
    <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Content (offset for fixed sidebar) */}
      <div className={`flex flex-col min-w-0 min-h-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
        {/* ===== Sticky Header ===== */}
        <div className="sticky top-0 z-20">
          <Portalheader title="Purchase History" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} searchValue={searchValue} setSearchValue={setSearchValue} />
        </div>

        {/* ===== Main Section ===== */}
        <main className="mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
          <div className="flex flex-col min-h-0 h-full">
            {/* Title + subtitle */}
           <h2 className="text-[26px] font-bold leading-none tracking-normal">
  Purchase History
</h2>
<p className={`mt-2 text-[15px] font-normal leading-none tracking-normal ${subText}`}>
  View all your transactions and downloads
</p>


            {/* Top stats row */}
            <div className={`${isDark ? 'bg-[#131313]' : 'bg-white'} rounded-lg pl-4 pr-4 mt-4 mb-3`}> 
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {/* Total Spent */}
              <div className={`${isDark ? 'bg-zinc-800' : 'bg-gray-100'} rounded-xl p-4 flex items-center gap-3`}>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-zinc-800 text-white' : ' text-black'}`}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className={`text-xs ${subText}`}>Total Spent</p>
                  <p className="text-lg font-semibold mt-1">
                    ₹{stats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Total Orders */}
              <div className={`${isDark ? 'bg-zinc-800' : 'bg-gray-100'} rounded-xl p-4 flex items-center gap-3`}>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-zinc-800 text-white' : ' text-black'}`}>
                  <Package size={20} />
                </div>
                <div>
                  <p className={`text-xs ${subText}`}>Total Orders</p>
                  <p className="text-lg font-semibold mt-1">{stats.totalOrders}</p>
                </div>
              </div>

              {/* Avg Order Value */}
              <div className={`${isDark ? 'bg-zinc-800' : 'bg-gray-100'} rounded-xl p-4 flex items-center gap-3`}>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-zinc-800 text-white' : 'white text-black'}`}>
                 <TrendingUp size={18} />
                </div>
                <div>
                  <p className={`text-xs ${subText}`}>Avg Order Value</p>
                  <p className="text-lg font-semibold mt-1">₹{stats.avgOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            </div>

            {/* Purchase List */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 mt-2 space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                <div key={item.id} className={`${panelBg} rounded-xl border p-4 mb-4`}>
                  {/* Top row: Title + badge on left, actions on right */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-semibold">
                          {item.title}
                        </h3>
                        <span className={`${item.typeColor} ${item.typeTextColor} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer ${viewBtn}`}
                        onClick={() => setActiveInvoice(item)}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>

                      <button className={`${subText}  hover:text-zinc-300 cursor-pointer transition-colors`}>
                        <Download color={isDark ? "white" : "black"} size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Second row: Date + Price */}
                  <div className="flex items-center gap-4 flex-wrap mb-3">
                    <div className={`flex items-center gap-1.5 ${subText}`}>
                      <Calendar size={14} />
                      <span className="text-xs">{item.date}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${subText}`}>
                      <span className="text-xs">₹</span>
                      <span className="text-xs font-medium text-white">₹{item.price}</span>
                    </div>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${chipBg} px-3 py-1.5 rounded-lg text-xs`}>
                      156 Videos
                    </span>
                    <span className={`${chipBg} px-3 py-1.5 rounded-lg text-xs`}>
                      Digital TextChapter
                    </span>
                    <span className={`${chipBg} px-3 py-1.5 rounded-lg text-xs`}>
                      Practice Tests
                    </span>
                  </div>
                </div>
              ))
              ) : (
                <div className={`${panelBg} rounded-xl border p-8 text-center`}>
                  <p className={`${subText}`}>No purchase history found matching "{searchValue}"</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {activeInvoice && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 ${
            isDark ? 'bg-black/60' : 'bg-black/40'
          } backdrop-blur-[3px]`}
          onClick={() => setActiveInvoice(null)}
        >
          <div
            className={`w-full max-w-lg sm:max-w-xl rounded-2xl border shadow-[0_18px_45px_rgba(0,0,0,0.55)] ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-50' : 'bg-white border-zinc-200 text-zinc-900'
            } max-h-[82vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-semibold">Purchase invoice</h3>

              <button
                className={`h-8 w-8 inline-flex items-center justify-center rounded-md border cursor-pointer ${
                  isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'
                }`}
                onClick={() => setActiveInvoice(null)}
                aria-label="Close invoice"
              >
                <X className={`w-4 h-4 ${subText}`} />
              </button>
            </div>

            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 overflow-y-auto no-scrollbar">

              <div>
                <h4 className="text-sm sm:text-base font-semibold mb-2">
                  {activeInvoice.title}
                </h4>
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-[13px] ${subText}`}>
                  <div>
                    <div className="uppercase tracking-wide text-[10px] mb-0.5">Order ID</div>
                    <div className="font-medium text-xs">#INAI-{23581 + activeInvoice.id}</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-wide text-[10px] mb-0.5">Purchase Date</div>
                    <div className="font-medium text-xs">{activeInvoice.date}</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-wide text-[10px] mb-0.5">Amount</div>
                    <div className="font-semibold text-xs">₹{activeInvoice.price.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              <button
                className={`w-full flex items-center justify-center gap-2 rounded-lg border text-xs sm:text-sm py-2.5 cursor-pointer ${
                  isDark
                    ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                    : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                <Download className="w-4 h-4"/>
                <span>Download Invoice PDF</span>
              </button>

              <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} pt-4`}> 
                <div className="text-sm font-semibold mb-1">Need Help?</div>
                <p className={`text-xs ${subText} mb-3`}>
                  If you have issues with your purchase, you can request support or raise a refund.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer ${
                      isDark
                        ? ' border border-zinc-700 text-white'
                        : 'bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    Contact Support
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer ${
                      isDark
                        ? 'bg-red-900 hover:bg-red-900 text-white'
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }`}
                  >
                    Request Refund
                  </button>
                </div>
              </div>

              <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} pt-4`}> 
                <div className="text-sm font-semibold mb-3">Related Recommendations</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 text-xs space-y-1 ${
                        isDark ? 'bg-zinc-800' : 'bg-zinc-50'
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {idx === 1 && 'Advanced Math Set'}
                        {idx === 2 && 'Physics Crash Course'}
                        {idx === 3 && 'Competitive Booster'}
                      </div>
                      <div className={`${subText}`}>{idx === 3 ? 'Practice Tests' : 'Class 12'}</div>
                      <div className="font-semibold">₹{idx === 3 ? '699' : idx === 2 ? '1299' : '1299'}</div>
                      <button
                        className={`mt-2 w-full rounded-md py-1.5 text-xs font-medium cursor-pointer ${
                          isDark
                            ? 'border border-zinc-600 text-zinc-100 hover:bg-zinc-600'
                            : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Buy Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}