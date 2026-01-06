
// import React, { useState } from 'react';
// import { Eye, EyeOff } from 'lucide-react';

// export default function LectureSignUp() {
//     const [formData, setFormData] = useState({
//         email: '',
//         password: ''
//     });
//     const [showPassword, setShowPassword] = useState(false);

//     const handleChange = (e) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value
//         });
//     };

//     const handleSubmit = () => {
//         console.log('Form submitted:', formData);
//         alert('Form submitted! Check console for data.');
//     };

//     return (
//         <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
//             {/* First Div - Logo at top */}
//             <div className="w-full pt-8 pb-10 pl-20">
//                 <img
//                     src="/inai-logo-dark.png"
//                     alt="INAi Logo"
//                     className="h-15 ml-65 w-auto"
//                 />
//             </div>

//             {/* Second Div - Main content with two columns */}
//             <div className="flex-1 flex overflow-hidden">
//                 {/* Left Side - Model Image */}
//                 <div className="w-1/2 h-full flex items-end justify-center pl-20">
//                     <img
//                         src="/Model.png"
//                         alt="Model"
//                         className="h-5/5 object-contain object-bottom"
//                     />
//                 </div>

//                 {/* Right Side - Form */}
//                 <div className="w-1/2 h-full flex items-center justify-start pr-20">
//                     <div className="w-full bg-zinc-900 rounded-lg p-8 mb-40" style={{ width: '800px' }}>
//                         <h2 className="text-white text-3xl font-bold mb-4 md:mb-6 capitalize leading-none">
//                             INAi Credentials (Provided By Us)
//                         </h2>

//                         <div className="space-y-5">
//                             <div>
//                                 <label className="text-white text-sm font-medium block mb-2 capitalize leading-none">
//                                     Email
//                                 </label>
//                                 <input
//                                     type="email"
//                                     name="email"
//                                     value={formData.email}
//                                     onChange={handleChange}
//                                     placeholder="Enter Email"
//                                     className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:border-zinc-600"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="text-gray-400 text-xs block mb-2">

//                                 </label>
//                                 <label className="text-white text-sm font-medium block mb-2 capitalize leading-none">
//                                     INAi Password
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         type={showPassword ? "text" : "password"}
//                                         name="password"
//                                         value={formData.password}
//                                         onChange={handleChange}
//                                         placeholder="Enter password"
//                                         className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded px-3 py-2.5 pr-10 placeholder-gray-600 focus:outline-none focus:border-zinc-600"
//                                     />
//                                     <button
//                                         type="button"
//                                         onClick={() => setShowPassword(!showPassword)}
//                                         className="absolute right-3top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
//                                     >
//                                         {showPassword ? (
//                                             <EyeOff className="w-4 h-4" />
//                                         ) : (
//                                             <Eye className="w-4 h-4" />
//                                         )}
//                                     </button>
//                                 </div>
//                             </div>


//                             <div className="flex justify-center mt-4 md:mt-6">
//                                 <button
//                                     onClick={handleSubmit}
//                                     className="px-20 bg-white cursor-pointer text-black font-inter font-bold text-[16px] leading-[100%] tracking-[0%] text-center capitalize rounded py-2.5 hover:bg-gray-100 transition"
//                                 >
//                                     Sign Up
//                                 </button>

//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


// ========================================== main code ===============================
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getAsset } from "../../utils/assets";

export default function LectureSignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Form submitted! Check console for data.");
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
      {/* ====== Logo (always visible) ====== */}
      <div className="w-full pt-8 pb-10 pl-20 z-20">
        <img
          src={getAsset("inailogo_dark")}
          alt="INAi Logo"
          className="h-28 w-auto"
        />
      </div>

      {/* ====== Main Content ====== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ===== Desktop View ===== */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Left Side - Model */}
          <div className="w-1/2 h-full flex items-end justify-center pl-20">
            <img
              src={getAsset("Model")}
              alt="Model"
              className="h-full object-contain object-bottom"
            />
          </div>

          {/* Right Side - Form */}
          <div className="w-1/2 h-full flex items-center justify-start pr-20">
            <div
              className="w-full bg-zinc-900 rounded-lg p-8"
              style={{ width: "800px" }}
            >
              <h2 className="text-white text-3xl font-bold mb-6 capitalize leading-none">
                INAI Credentials (Provided By Us)
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label className="text-white text-sm font-medium block mb-2 capitalize leading-none">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Email"
                    className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="text-white text-sm font-medium block mb-2 capitalize leading-none">
                    INAi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded px-3 py-2.5 pr-10 placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-6">
                  <button
                    type="submit"
                    className="px-20 bg-white cursor-pointer text-black font-bold text-[16px] capitalize rounded py-2.5 hover:bg-gray-100 transition"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ===== Mobile View ===== */}
        <div className="absolute inset-0 flex md:hidden items-center justify-center">
          {/* Model Image as Background */}
          <img
            src="/Model.png"
            alt="Model"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
          />

          {/* Floating Form with Blur */}
          <div className="relative z-10 w-11/12 max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-white text-2xl font-bold mb-4 text-center">
              INAi Credentials
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email"
                  className="w-full bg-white/10 text-white text-sm border border-white/20 rounded px-3 py-2.5 placeholder-gray-300 focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  INAi Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full bg-white/10 text-white text-sm border border-white/20 rounded px-3 py-2.5 pr-10 placeholder-gray-300 focus:outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-10 bg-white text-black font-bold rounded py-2.5 hover:bg-gray-100 transition"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
