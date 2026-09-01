import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TherapistStudentAssignmentModal from "../components/TherapistStudentAssignmentModal.jsx";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const CLASS_OPTIONS = [
  "PrePrimary",
  "Primary 1",
  "Primary 2",
  "Secondary",
  "Pre vocational 1",
  "Pre vocational 2",
  "Care group below 18 years",
  "Care group Above 18 years",
  "Vocational 18-35 years",
];



const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("        ");
  const [activeTab, setActiveTab] = useState("students");
  const [filterOption, setFilterOption] = useState("all");
  const [selectedClass, setSelectedClass] = useState(
    () => sessionStorage.getItem("td_selectedClass") || "all",
  );
  const [isSearchFloating, setIsSearchFloating] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState(
    () => sessionStorage.getItem("td_studentSearch") || "",
  );
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const visibleStudents = useMemo(() => {
    let visible = allStudents;
    if (studentSearch && studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      visible = visible.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const classLabel = (
          s.class_name ||
          s.className ||
          ""
        )
          .toString()
          .toLowerCase();
        return name.includes(q) || classLabel.includes(q);
      });
    }
    if (selectedClass && selectedClass !== "all") {
      visible = visible.filter((s) => {
        const classLabel = (
          s.class_name ||
          s.className ||
          ""
        ).toString();
        return classLabel.toLowerCase().includes(selectedClass.toLowerCase());
      });
    }
    return visible;
  }, [allStudents, studentSearch, selectedClass]);
  const [therapists, setTherapists] = useState([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTherapist, setAssignmentTherapist] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);



  useEffect(() => {
    const handleScroll = () => {
      const searchBarPosition = document
        .getElementById("search-container")
        ?.getBoundingClientRect().top;
      if (searchBarPosition < 0) {
        setIsSearchFloating(true);
      } else {
        setIsSearchFloating(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch current user name from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data?.name) setUserName(data.name);
        else if (data?.username) setUserName(data.username);
        else if (data?.email) setUserName(data.email.split("@")[0]);
      } catch (err) {
        // silently fail and keep fallback
      }
    };

    fetchUser();
  }, []);

  // Fetch assigned students once; search/class filters are client-side only.
  useEffect(() => {
    const fetchStudents = async () => {
      if (!userName) return;
      setStudentsLoading(true);
      setProfileError("");
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/v1/teachers/me/students`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const items = Array.isArray(data) ? data : [];
        const normalized = items.map((s) => ({
          ...s,
          photo_url: s.photo_url || s.photoUrl || null,
        }));

        const sortedStudents = [...normalized].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setAllStudents(sortedStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
        if (err.response?.status === 404) {
          setProfileError(
            "Your teacher profile was not found. Please ask the administrator to verify that your login email matches your teacher profile email."
          );
        } else {
          setProfileError("Failed to fetch assigned students. Please try again later.");
        }
        setAllStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [userName]);

  useEffect(() => {
    if (!studentsLoading && allStudents.length > 0) {
      const savedScroll = sessionStorage.getItem("td_scroll_pos");
      if (savedScroll !== null) {
        const y = parseInt(savedScroll, 10);
        setTimeout(() => {
          window.scrollTo(0, y);
          sessionStorage.removeItem("td_scroll_pos");
        }, 100);
      }
    }
  }, [studentsLoading, allStudents]);

  useEffect(() => {
    const fetchTherapists = async () => {
      setTherapistsLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/therapists/`, {
          params: { page: 1, limit: 50 },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        const sorted = items
          .slice()
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setTherapists(sorted);
      } catch (err) {
        console.error("Error fetching therapists:", err);
        setTherapists([]);
      } finally {
        setTherapistsLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  const handleAssignStudents = (therapist) => {
    setAssignmentTherapist(therapist);
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setAssignmentTherapist(null);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleStudentClick = (studentId) => {
    sessionStorage.setItem("td_scroll_pos", String(window.scrollY));
    sessionStorage.setItem("td_studentSearch", studentSearch);
    sessionStorage.setItem("td_selectedClass", selectedClass);
    navigate(`/student/${studentId}`);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setPasswordError("Authentication token not found. Please log in again.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await axios.post(
        `${API_BASE_URL}/api/v1/auth/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to change password. Please try again.";
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      {/* ================= DESKTOP & TABLET LAYOUT (>=768px) ================= */}
      <div className="hidden md:contents">
    <div className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-x-hidden py-20">
      {/* Top-right controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={() => {
            setShowPasswordModal(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordError("");
            setPasswordSuccess("");
          }}
          className="px-4 py-2 text-sm rounded-xl border border-[#E38B52] text-[#E38B52] bg-white/80 hover:bg-[#E38B52]/10 transition-all shadow-sm"
        >
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
          Logout
        </button>
      </div>

      {/* Header Text */}
      <div className="text-center mb-12 z-10">
        <h1 className="text-4xl font-bold text-[#170F49] font-baskervville">
          Hi {userName}
        </h1>
        <p className="text-[#6F6C8F] mt-2">
          {activeTab === "students" ? "View and Manage Students" : "View Therapists and Assign Students"}
        </p>
        <p className="text-[#6F6C8F] text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Floating Search Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          activeTab === "students" && isSearchFloating ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="backdrop-blur-xl p-4">
          <div className="w-[90%] max-w-[1200px] mx-auto">
            <div className="relative w-full md:w-[443px] mx-auto">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-10 py-3 rounded-xl border bg-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animated background blobs */}
      <div className="fixed top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="fixed -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="fixed top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />

      <div className="w-[90%] max-w-[1200px] mx-4 z-10">
        {/* Main container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          <div className="flex justify-center mb-8">
            <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative">
              <div
                className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                style={{
                  left: activeTab === "students" ? "4px" : "calc(50% + 0px)",
                  width: "calc(50% - 6px)",
                  background: "linear-gradient(135deg, #E38B52 0%, #E38B52 100%)",
                }}
              />

              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                  activeTab === "students"
                    ? "text-white scale-105"
                    : "text-[#170F49] hover:text-[#E38B52]"
                }`}
              >
                Students List
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("therapists")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                  activeTab === "therapists"
                    ? "text-white scale-105"
                    : "text-[#170F49] hover:text-[#E38B52]"
                }`}
              >
                Therapists List
              </button>
            </div>
          </div>

          {activeTab === "students" && (
            <>
          {/* Filter and Search Section */}
          <div className="flex justify-between items-center mb-8 px-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                className="w-[443px] pl-10 pr-10 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_8px_-1px_rgba(0,0,0,0.1)]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Filter Students
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      showFilterDropdown ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {/* Filter Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="p-2 space-y-2">
                      <select
                        value={filterOption}
                        onChange={(e) => {
                          setFilterOption(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                      >
                        <option value="all">All Students</option>
                        <option value="class">Class</option>
                      </select>

                      {filterOption === "class" && (
                        <select
                          value={selectedClass}
                          onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                        >
                          <option value="all">All Classes</option>
                          <option value="PrePrimary">PrePrimary</option>
                          <option value="Primary 1">Primary 1</option>
                          <option value="Primary 2">Primary 2</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Pre vocational 1">
                            Pre vocational 1
                          </option>
                          <option value="Pre vocational 2">
                            Pre vocational 2
                          </option>
                          <option value="caregroup-below-18">
                            Care group below 18 years
                          </option>
                          <option value="caregroup-above-18">
                            Care group Above 18 years
                          </option>
                          <option value="vocational">
                            Vocational 18-35 years
                          </option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="grid grid-cols-1 gap-4 px-4">
            {profileError ? (
              <div className="text-center text-red-600 bg-red-50/80 border border-red-200 rounded-2xl p-6 shadow-sm font-medium">
                {profileError}
              </div>
            ) : studentsLoading ? (
              <div className="text-center text-[#6F6C8F]">
                Loading students...
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="text-center text-[#6F6C8F]">
                No students found.
              </div>
            ) : (
              visibleStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student.id)}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 text-[#170F49]">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={
                            student.photo_url ||
                            `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(
                              student.name || "S",
                            )}&size=250&background=EFEFEF&color=170F49`
                          }
                          alt="Student"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/64x64/EFEFEF/AAAAAA?text=Photo";
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#170F49]">
                          {student.name}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Class:</span>{" "}
                            {student.class_name || student.className || "-"}
                          </p>
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Division:</span>{" "}
                            {student.division || student.division || "-"}
                          </p>
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Roll No:</span>{" "}
                            {student.roll_no || student.rollNo || "-"}
                          </p>
                        </div>
                      </div>

                      <button className="text-[#E38B52] hover:text-[#4f46e5] transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
            </>
          )}

          {activeTab === "therapists" && (
            <div className="px-4">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-[#170F49]">Therapist List</h2>
              <p className="text-sm text-[#6F6C8F] mt-1">Assign students to therapists. Details, add, and delete are admin-only.</p>
            </div>
            {therapistsLoading ? (
              <div className="text-center text-[#6F6C8F]">Loading therapists...</div>
            ) : therapists.length === 0 ? (
              <div className="text-center text-[#6F6C8F]">No therapists found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {therapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="bg-white rounded-2xl p-6 shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4 text-[#170F49]">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden">
                          <img src={therapist.photo_url || therapist.photoUrl || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(therapist.name || "Therapist")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-[#170F49] truncate">{therapist.name || "-"}</h3>
                          <div className="mt-1 flex items-center text-sm text-[#6F6C8F] truncate">
                            <span className="text-sm mr-1.5">🩺</span> {therapist.specialization || "Not provided"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignStudents(therapist)}
                        className="px-5 py-2 text-sm font-semibold bg-[#E38B52] text-white rounded-xl shadow-sm hover:bg-[#E38B52]/90 transition-all hover:scale-[1.02] whitespace-nowrap"
                      >
                        Assign Students
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      <TherapistStudentAssignmentModal
        open={showAssignmentModal}
        therapist={assignmentTherapist}
        classOptions={CLASS_OPTIONS}
        teacherScope={true}
        onClose={closeAssignmentModal}
        onSaved={() => {
          closeAssignmentModal();
        }}
      />

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(100px, -100px) scale(1.2);
          }
          50% {
            transform: translate(0, 100px) scale(0.9);
          }
          75% {
            transform: translate(-100px, -50px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        .animation-delay-3000 {
          animation-delay: -5s;
        }
        .animation-delay-5000 {
          animation-delay: -10s;
        }
        .animation-delay-7000 {
          animation-delay: -15s;
        }
      `}</style>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-[#170F49] mb-4 text-center">
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#170F49] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#170F49] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#170F49] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-green-600">{passwordSuccess}</p>
              )}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#E38B52] text-white font-semibold shadow hover:bg-[#E38B52]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-100 transform scale-100 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#170F49] mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to log out of your session? Unsaved changes may be lost.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm w-full"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    try {
                      localStorage.removeItem('token');
                      delete axios.defaults.headers.common['Authorization'];
                    } catch (e) {}
                    navigate('/login');
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors text-sm w-full"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      </div>

      {/* ================= MOBILE LAYOUT (<768px) ================= */}
      <div className="contents md:hidden">
        <div className="min-h-[100dvh] w-full flex bg-[#f7f7f7] relative overflow-x-hidden">
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white shadow-2xl z-50">
        <div className="p-6 text-center border-b border-gray-100 mt-4">
           <h1 className="text-2xl font-bold text-[#170F49] font-baskervville">Therapinc</h1>
           <p className="text-xs text-[#6F6C8F] mt-1">Teacher Portal</p>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-3">
           <button onClick={() => setActiveTab("students")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'students' ? 'bg-[#E38B52] text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             Students
           </button>
           <button onClick={() => setActiveTab("therapists")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'therapists' ? 'bg-[#E38B52] text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
             Therapists
           </button>
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-3 mb-4">
           <button onClick={() => { setShowPasswordModal(true); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordSuccess(""); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f0f0f0] text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
              Change Password
           </button>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
              Logout
           </button>
        </div>
      </aside>

      {/* ----------------- MOBILE BOTTOM NAV ----------------- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-[60] px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button onClick={() => setActiveTab("students")} className={`flex flex-col items-center justify-center w-full h-16 transition ${activeTab==='students'?'text-[#E38B52] scale-110':'text-gray-400 scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[10px] mt-1 font-medium">Students</span>
         </button>
         <button onClick={() => setActiveTab("therapists")} className={`flex flex-col items-center justify-center w-full h-16 transition ${activeTab==='therapists'?'text-[#E38B52] scale-110':'text-gray-400 scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="text-[10px] mt-1 font-medium">Therapists</span>
         </button>
         
         <div className="relative flex flex-col items-center justify-center w-full h-16 group">
            <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 transition hover:text-gray-600">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               <span className="text-[10px] mt-1 font-medium">Menu</span>
            </button>
            <div className="absolute bottom-16 right-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 hidden group-hover:flex group-focus-within:flex flex-col overflow-hidden mb-2">
               <button onClick={() => { setShowPasswordModal(true); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordSuccess(""); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition text-sm font-medium text-gray-700 border-b border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                  Password
               </button>
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition text-sm font-medium text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                  Logout
               </button>
            </div>
         </div>
      </div>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <main className="flex-1 w-full lg:ml-64 flex flex-col pb-[calc(80px+env(safe-area-inset-bottom)+16px)] lg:pb-8 min-h-[100dvh]">
          {/* Mobile Header Title */}
          <div className="lg:hidden w-full p-4 text-center bg-white shadow-sm z-40 sticky top-0">
              <h1 className="text-xl font-bold text-[#170F49] font-baskervville">Teacher Portal</h1>
          </div>

          <div className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 z-10">
             <div className="relative bg-white/30 backdrop-blur-xl rounded-[24px] shadow-xl p-4 sm:p-6 border border-white/20 h-auto min-h-[50dvh] mb-6">

          <div className="flex justify-center mb-8">
            <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative">
              <div
                className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                style={{
                  left: activeTab === "students" ? "4px" : "calc(50% + 0px)",
                  width: "calc(50% - 6px)",
                  background: "linear-gradient(135deg, #E38B52 0%, #E38B52 100%)",
                }}
              />

              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                  activeTab === "students"
                    ? "text-white scale-105"
                    : "text-[#170F49] hover:text-[#E38B52]"
                }`}
              >
                Students List
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("therapists")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                  activeTab === "therapists"
                    ? "text-white scale-105"
                    : "text-[#170F49] hover:text-[#E38B52]"
                }`}
              >
                Therapists List
              </button>
            </div>
          </div>

          {activeTab === "students" && (
            <>
          {/* Filter and Search Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-5 px-2 gap-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-10 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full">
              <div className="relative">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_8px_-1px_rgba(0,0,0,0.1)]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Filter Students
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      showFilterDropdown ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {/* Filter Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="p-2 space-y-2">
                      <select
                        value={filterOption}
                        onChange={(e) => {
                          setFilterOption(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                      >
                        <option value="all">All Students</option>
                        <option value="class">Class</option>
                      </select>

                      {filterOption === "class" && (
                        <select
                          value={selectedClass}
                          onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                        >
                          <option value="all">All Classes</option>
                          <option value="PrePrimary">PrePrimary</option>
                          <option value="Primary 1">Primary 1</option>
                          <option value="Primary 2">Primary 2</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Pre vocational 1">
                            Pre vocational 1
                          </option>
                          <option value="Pre vocational 2">
                            Pre vocational 2
                          </option>
                          <option value="caregroup-below-18">
                            Care group below 18 years
                          </option>
                          <option value="caregroup-above-18">
                            Care group Above 18 years
                          </option>
                          <option value="vocational">
                            Vocational 18-35 years
                          </option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="grid grid-cols-1 gap-3 px-0 sm:px-2">
            {profileError ? (
              <div className="text-center text-red-600 bg-red-50/80 border border-red-200 rounded-2xl p-6 shadow-sm font-medium">
                {profileError}
              </div>
            ) : studentsLoading ? (
              <div className="text-center text-[#6F6C8F]">
                Loading students...
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="text-center text-[#6F6C8F]">
                No students found.
              </div>
            ) : (
              visibleStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student.id)}
                    className="bg-white rounded-2xl py-2.5 px-3 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-md transition-all duration-300 cursor-pointer mb-1.5"
                  >
                    <div className="flex items-center gap-4 text-[#170F49]">
                      <div className="w-[50px] h-[50px] rounded-lg overflow-hidden shrink-0">
                        <img
                          src={
                            student.photo_url ||
                            `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(
                              student.name || "S",
                            )}&size=250&background=EFEFEF&color=170F49`
                          }
                          alt="Student"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/64x64/EFEFEF/AAAAAA?text=Photo";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate">
                          {student.name}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Class:</span>{" "}
                            {student.class_name || student.className || "-"}
                          </p>
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Division:</span>{" "}
                            {student.division || student.division || "-"}
                          </p>
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Roll No:</span>{" "}
                            {student.roll_no || student.rollNo || "-"}
                          </p>
                        </div>
                      </div>

                      <button className="text-[#E38B52] hover:text-[#4f46e5] transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
            </>
          )}

          {activeTab === "therapists" && (
            <div className="px-4">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-[#170F49]">Therapist List</h2>
              <p className="text-sm text-[#6F6C8F] mt-1">Assign students to therapists. Details, add, and delete are admin-only.</p>
            </div>
            {therapistsLoading ? (
              <div className="text-center text-[#6F6C8F]">Loading therapists...</div>
            ) : therapists.length === 0 ? (
              <div className="text-center text-[#6F6C8F]">No therapists found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {therapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="bg-white rounded-2xl py-3 px-3.5 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300 mb-1.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-[#170F49]">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-lg overflow-hidden shrink-0">
                          <img src={therapist.photo_url || therapist.photoUrl || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(therapist.name || "Therapist")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate pr-2">
                            {therapist.name || "-"}
                          </h3>
                          <div className="mt-0.5 flex items-center text-[12px] sm:text-[13px] text-[#6F6C8F] truncate">
                            <span className="text-sm mr-1.5">🩺</span> {therapist.specialization || "Not provided"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 sm:mt-0 flex justify-end items-center">
                        <button
                          type="button"
                          onClick={() => handleAssignStudents(therapist)}
                          className="px-4 py-1.5 sm:px-5 sm:py-2 text-[13px] sm:text-sm font-semibold bg-[#E38B52] text-white rounded-xl shadow-sm hover:bg-[#E38B52]/90 transition-all hover:scale-[1.02] whitespace-nowrap"
                        >
                          Assign Students
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      <TherapistStudentAssignmentModal
        open={showAssignmentModal}
        therapist={assignmentTherapist}
        classOptions={CLASS_OPTIONS}
        teacherScope={true}
        onClose={closeAssignmentModal}
        onSaved={() => {
          closeAssignmentModal();
        }}
      />

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(100px, -100px) scale(1.2);
          }
          50% {
            transform: translate(0, 100px) scale(0.9);
          }
          75% {
            transform: translate(-100px, -50px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        .animation-delay-3000 {
          animation-delay: -5s;
        }
        .animation-delay-5000 {
          animation-delay: -10s;
        }
        .animation-delay-7000 {
          animation-delay: -15s;
        }
      `}</style>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-[#170F49] mb-4 text-center">
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#170F49] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#170F49] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#170F49] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-green-600">{passwordSuccess}</p>
              )}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#E38B52] text-white font-semibold shadow hover:bg-[#E38B52]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-100 transform scale-100 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#170F49] mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to log out of your session? Unsaved changes may be lost.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm w-full"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    try {
                      localStorage.removeItem('token');
                      delete axios.defaults.headers.common['Authorization'];
                    } catch (e) {}
                    navigate('/login');
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors text-sm w-full"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>

      </div>
    </>
  );
};

export default TeacherDashboard;
