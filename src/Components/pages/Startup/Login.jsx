import React, { useState } from "react";
import { Eye, EyeOff, Moon, Sun, ArrowLeft } from "lucide-react";
import { getAsset, handlesuccess, handleerror, BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";


function Login({ theme, isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      // Force lowercase and remove invalid characters
      const formatted = value.toLowerCase().replace(/[^a-z0-9@.]/g, '');

      setFormData({ ...formData, [name]: formatted });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      handleerror("Please enter your email");
      return;
    }
    if (!forgotEmail.endsWith('@gmail.com')) {
      handleerror("Email must be a valid @gmail.com address");
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/auth/forgot-password`,
        { email: forgotEmail },
        {
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json"
          },
        }
      );

      if (response.status === 200) {
        handlesuccess(response.data?.message || "Password reset link sent to your email.");
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to send reset link. Please try again.";
      handleerror(message);
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      handleerror("Please fill in both email and password");
      return;
    }
    if (!formData.email.endsWith('@gmail.com')) {
      handleerror("Email must be a valid @gmail.com address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/auth/login`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const payload = response?.data || {};
        const data = payload?.data || {};

        const userType = data?.user_type || payload?.user_type || payload?.role;
        const workType = data?.work_type || payload?.work_type;
        const contactExists = data?.contact_exists || payload?.contact_exists;
        const accessToken = data?.access_token || data?.token || payload?.access_token || payload?.token;
        const refreshToken = data?.refresh_token || payload?.refresh_token;
        const adminId = data?.admin_id || payload?.admin_id;
        const memberId = data?.member_id || payload?.member_id;
        const successMessage = data?.message || payload?.message || "Login successfully";

        console.log('Login response:', payload);
        console.log('Extracted data:', { userType, workType, accessToken, refreshToken, adminId, memberId });

        // Admin login
        if (userType === "admin" && workType === "admin") {
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
          }
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
          if (userType) {
            localStorage.setItem("user_type", userType);
          }
          if (adminId !== undefined && adminId !== null) {
            localStorage.setItem("admin_id", adminId);
          }

          handlesuccess(successMessage);

          // If profile/contact is already completed, go directly to dashboard
          // Otherwise, open profile completion (signup) on first time
          if (contactExists) {
            setTimeout(() => {
              navigate("/admin");
            }, 2000);
          } else {
            setTimeout(() => {
              navigate("/signup", {
                state: {
                  email: formData.email,
                  password: formData.password,
                  token: accessToken,
                },
              });
            }, 2000);
          }
        }
        // Chapter member
        else if (userType === "member" && workType === "chapter") {
          handlesuccess(successMessage);
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
          }
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
          if (userType) {
            localStorage.setItem("user_type", userType);
          }
          if (memberId !== undefined && memberId !== null) {
            localStorage.setItem("member_id", memberId);
          }
          if (adminId !== undefined && adminId !== null) {
            localStorage.setItem("admin_id", adminId);
          }
          setTimeout(() => {
            navigate("/chapter");
          }, 2000);
        }
        // Student member
        else if (userType === "member" && workType === "student") {
          handlesuccess(successMessage);
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
          }
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
          if (userType) {
            localStorage.setItem("user_type", userType);
          }
          if (memberId !== undefined && memberId !== null) {
            localStorage.setItem("member_id", memberId);
          }
          if (adminId !== undefined && adminId !== null) {
            localStorage.setItem("admin_id", adminId);
          }
          setTimeout(() => {
            navigate("/student");
          }, 2000);
        }
        // Lecture member
        else if (userType === "member" && workType === "lecture") {
          handlesuccess(successMessage);
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
          }
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
          if (userType) {
            localStorage.setItem("user_type", userType);
          }
          if (memberId !== undefined && memberId !== null) {
            localStorage.setItem("member_id", memberId);
          }
          if (adminId !== undefined && adminId !== null) {
            localStorage.setItem("admin_id", adminId);
          }
          setTimeout(() => {
            navigate("/lecture");
          }, 2000);
        }
        // Fallback: treat as admin needing profile completion
        else {
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
          }
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
          if (userType) {
            localStorage.setItem("user_type", userType);
          }
          if (adminId !== undefined && adminId !== null) {
            localStorage.setItem("admin_id", adminId);
          }

          handlesuccess(successMessage);
          setTimeout(() => {
            navigate("/signup", {
              state: {
                email: formData.email,
                password: formData.password,
                token: accessToken,
              },
            });
          }, 2000);
        }
      }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error?.detail ||
        "Login failed. Please try again.";
      handleerror(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`w-full h-screen flex flex-col items-center justify-center overflow-hidden px-4 transition-colors duration-500 ${isDark
        ? "bg-black text-white"
        : "bg-[#F5F5F9] text-zinc-900"
        }`}
    >
      <div className="mb-8 sm:mb-10 md:mb-12 text-center">
        <div className="flex justify-center items-center">
          <img
            src={getAsset(isDark ? "inailogo_dark" : "inailogo_light")}
            alt="INAI VERSE Logo"
            className="w-auto h-16 sm:h-20 md:h-24 lg:h-28 object-contain transition-all duration-300"
          />
        </div>
      </div>

      <div className="w-full max-w-md px-4">
        <div
          className={`relative rounded-2xl p-8 sm:p-10 transition-all duration-500 ${isDark
            ? "bg-zinc-900/95 border border-zinc-800"
            : "bg-white border border-zinc-100"
            }`}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className={(isDark ? "text-gray-200 hover:text-white hover:bg-white/10" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100") + " absolute cursor-pointer top-4 left-4 sm:top-4 sm:left-4 p-2 rounded-full transition-all duration-300"}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Header */}
          <div className="mb-8 text-center">
            <h3
              className={`text-3xl sm:text-4xl font-bold mb-3 transition-all duration-500 ${isDark ? "text-white" : "text-zinc-900"
                }`}
            >
              {showForgotPassword ? "Reset Password" : "Welcome Back"}
            </h3>
            <p
              className={`text-sm sm:text-base transition-all duration-500 ${isDark ? "text-gray-400" : "text-zinc-600"
                }`}
            >
              {showForgotPassword
                ? "Enter your email to receive a reset link"
                : "Sign in to continue to ED INAI"}
            </p>
          </div>

          {/* Forms */}
          <div className="relative min-h-[300px]">
            {showForgotPassword ? (
              <div className="animate-fadeIn">
                <form className="space-y-6" onSubmit={handleForgotPassword}>
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label
                      className={`block text-sm font-semibold ${isDark ? "text-gray-200" : "text-zinc-800"
                        }`}
                    >
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${isDark
                            ? "text-gray-500 group-focus-within:text-gray-300"
                            : "text-gray-400 group-focus-within:text-indigo-500"
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="forgotEmail"
                        value={forgotEmail}
                        onChange={(e) => {
                          const value = e.target.value;
                          const formatted = value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
                          const parts = formatted.split('@');
                          if (parts.length > 2) return;
                          if (parts.length === 2 && !"gmail.com".startsWith(parts[1])) return;
                          setForgotEmail(formatted);
                        }}
                        placeholder="you@example.com"
                        className={`w-full pl-12 pr-4 py-3.5 text-sm sm:text-base rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 ${isDark
                          ? "bg-zinc-800/60 text-white border-2 border-zinc-700/50 placeholder-gray-500 focus:border-white/20 focus:ring-white/10 hover:border-zinc-600"
                          : "bg-zinc-50 text-zinc-900 border-2 border-zinc-200 placeholder-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20 hover:border-zinc-300"
                          }`}
                        required
                        autoFocus
                      />
                    </div>
                    <p
                      className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-zinc-500"
                        }`}
                    >
                      We'll send a secure reset link to this email
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      className={`w-full font-bold text-base uppercase tracking-wide rounded-xl py-4 transition-all duration-300 focus:outline-none focus:ring-4 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${isDark
                        ? "bg-white text-black hover:bg-gray-100 focus:ring-white/20 shadow-white/10"
                        : "bg-[#696CFF] text-white hover:bg-[#696CFF]/80 focus:ring-indigo-500/30 shadow-zinc-900/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      {isForgotLoading ? (
                        <span className="flex items-center justify-center gap-3">
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Sending Link...
                        </span>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail("");
                      }}
                      className={`w-full font-semibold text-sm py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${isDark
                        ? "text-gray-300 hover:text-white hover:bg-zinc-800/50 focus:ring-zinc-700"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-300"
                        }`}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label
                      className={`block text-sm font-semibold ${isDark ? "text-gray-200" : "text-zinc-800"
                        }`}
                    >
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${isDark
                            ? "text-gray-500 group-focus-within:text-gray-300"
                            : "text-gray-400 group-focus-within:text-indigo-500"
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={`w-full pl-12 pr-4 py-3.5 text-sm sm:text-base rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 ${isDark
                          ? "bg-zinc-800/60 text-white border-2 border-zinc-700/50 placeholder-gray-500 focus:border-white/20 focus:ring-white/10 hover:border-zinc-600"
                          : "bg-[#F5F5F9] text-zinc-900 border-2 border-zinc-200 placeholder-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20 hover:border-zinc-300"
                          }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label
                      className={`block text-sm font-semibold ${isDark ? "text-gray-200" : "text-zinc-800"
                        }`}
                    >
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${isDark
                            ? "text-gray-500 group-focus-within:text-gray-300"
                            : "text-gray-400 group-focus-within:text-indigo-500"
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className={`w-full pl-12 pr-12 py-3.5 text-sm sm:text-base rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 ${isDark
                          ? "bg-zinc-800/60 text-white border-2 border-zinc-700/50 placeholder-gray-500 focus:border-white/20 focus:ring-white/10 hover:border-zinc-600"
                          : "bg-[#F5F5F9] text-zinc-900 border-2 border-zinc-200 placeholder-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20 hover:border-zinc-300"
                          }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 active:scale-95 p-1 rounded-lg cursor-pointer ${isDark
                          ? "text-gray-400 hover:text-white hover:bg-zinc-800"
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          }`}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className={`text-sm font-semibold transition-all duration-300 hover:underline underline-offset-4 cursor-pointer ${isDark
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-indigo-600 hover:text-indigo-700"
                        }`}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Sign In Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full font-bold text-base uppercase tracking-wide rounded-xl py-4 transition-all duration-300 focus:outline-none focus:ring-4 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer ${isDark
                        ? "bg-white text-black hover:bg-gray-100 focus:ring-white/20 shadow-white/10"
                        : "bg-[#696CFF] text-white hover:bg-[#696CFF]/90 focus:ring-indigo-500/30 shadow-zinc-900/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-3">
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Signing In...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
