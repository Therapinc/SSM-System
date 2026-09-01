import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

// Helper function to get therapy-specific sections
const getTherapySections = (therapyType) => {
  const sections = {
    "Speech Therapy": {
      receptive_language: {
        checked: false,
        notes: "",
        response: "",
        label: "Receptive Language Skills (Comprehension)",
      },
      expressive_language: {
        checked: false,
        notes: "",
        response: "",
        label: "Expressive Language Skills",
      },
      oral_motor_opt: {
        checked: false,
        notes: "",
        response: "",
        label: "Oral Motor & Oral Placement Therapy (OPT) Goals",
      },
      pragmatic_language: {
        checked: false,
        notes: "",
        response: "",
        label: "Pragmatic Language Skills (Social Communication)",
      },
      narrative_skills: {
        checked: false,
        notes: "",
        response: "",
        label: "Narrative Skills",
      },
    },
    "Behavioral Therapy": {
      behavior_regulation: {
        checked: false,
        notes: "",
        response: "",
        label: "Behavior Regulation & Self-Control",
      },
      attention_compliance: {
        checked: false,
        notes: "",
        response: "",
        label: "Attention, Compliance & Task Engagement",
      },
      emotional_regulation: {
        checked: false,
        notes: "",
        response: "",
        label: "Emotional Regulation Skills",
      },
      social_behavior: {
        checked: false,
        notes: "",
        response: "",
        label: "Social Behavior & Interaction Skills",
      },
      adaptive_behavior: {
        checked: false,
        notes: "",
        response: "",
        label: "Adaptive Behavior & Functional Skills",
      },
    },
    "Cognitive Therapy": {
      attention_concentration: {
        checked: false,
        notes: "",
        response: "",
        label: "Attention & Concentration Skills",
      },
      memory_recall: {
        checked: false,
        notes: "",
        response: "",
        label: "Memory & Recall Skills",
      },
      problem_solving: {
        checked: false,
        notes: "",
        response: "",
        label: "Problem Solving & Reasoning Skills",
      },
      executive_functioning: {
        checked: false,
        notes: "",
        response: "",
        label: "Executive Functioning Skills",
      },
      cognitive_flexibility: {
        checked: false,
        notes: "",
        response: "",
        label: "Cognitive Flexibility & Processing Skills",
      },
    },
    "Occupational Therapy": {
      daily_living_adl: {
        checked: false,
        notes: "",
        response: "",
        label: "Activities of Daily Living (ADL)",
      },
      sensory_integration_modulation: {
        checked: false,
        notes: "",
        response: "",
        label: "Sensory Integration and Modulation",
      },
      neuro_cognitive_rehabilitation: {
        checked: false,
        notes: "",
        response: "",
        label: "Neuro-Cognitive Rehabilitation",
      },
      fine_motor_hand_function: {
        checked: false,
        notes: "",
        response: "",
        label: "Fine Motor and Hand Function",
      },
      gross_motor_coordination_balance: {
        checked: false,
        notes: "",
        response: "",
        label: "Gross Motor Coordination and Balance",
      },
      psychosocial_behavioral_regulation: {
        checked: false,
        notes: "",
        response: "",
        label: "Psychosocial and Behavioral Regulation",
      },
      handwriting_pre_academics: {
        checked: false,
        notes: "",
        response: "",
        label: "Handwriting and Pre-Academics",
      },
    },
    "Physiotherapy": {
      gross_motor: { checked: false, notes: "", response: "", label: "Gross Motor Skills" },
      balance_postural: {
        checked: false,
        notes: "",
        response: "",
        label: "Balance & Postural Control",
      },
      strength_endurance: {
        checked: false,
        notes: "",
        response: "",
        label: "Strength & Endurance",
      },
      coordination_planning: {
        checked: false,
        notes: "",
        response: "",
        label: "Coordination & Motor Planning",
      },
      functional_mobility: {
        checked: false,
        notes: "",
        response: "",
        label: "Functional Mobility Skills",
      },
    },
  };
  return sections[therapyType] || sections["Speech Therapy"];
};

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("        ");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportDate, setReportDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [therapyType, setTherapyType] = useState("Occupational Therapy");
  const [specialization, setSpecialization] = useState("");



  const [goalsAchieved, setGoalsAchieved] = useState(
    getTherapySections("Occupational Therapy"),
  );
  const [unlockedGoals, setUnlockedGoals] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };
  const [progressLevel, setProgressLevel] = useState("Excellent");

  const [presentComplaints, setPresentComplaints] = useState("");
  const [currentObservation, setCurrentObservation] = useState("");
  const [assessmentDone, setAssessmentDone] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [filterOption, setFilterOption] = useState("all");
  const [selectedClass, setSelectedClass] = useState(
    () => sessionStorage.getItem("th_selectedClass") || "all",
  );
  const [isSearchFloating, setIsSearchFloating] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState(
    () => sessionStorage.getItem("th_studentSearch") || "",
  );
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const loadPreviousGoals = async (studentId, type) => {
    try {
      // Check for locally saved draft first
      const draftKey = `draft_therapy_report_${studentId}`;
      const localDraft = localStorage.getItem(draftKey);
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          setReportDate(parsed.reportDate || new Date().toISOString().slice(0, 10));
          setTherapyType(parsed.therapyType || type);
          setPresentComplaints(parsed.presentComplaints || "");
          setCurrentObservation(parsed.currentObservation || "");
          setAssessmentDone(parsed.assessmentDone || "");
          setProvisionalDiagnosis(parsed.provisionalDiagnosis || "");
          setGoalsAchieved(parsed.goalsAchieved || getTherapySections(type));
          setProgressLevel(parsed.progressLevel || "Excellent");
          showToast("Restored unsaved draft for this student.", "success");
          return;
        } catch (e) {
          console.error("Failed to parse local draft:", e);
        }
      }

      const token = localStorage.getItem("token");
      if (!token) return;
      const { data } = await axios.get(`${API_BASE_URL}/api/v1/therapy-reports/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort reports descending by report_date and fallback to id to ensure the latest is first
      const reports = Array.isArray(data) ? [...data] : [];
      reports.sort((a, b) => {
        const dateA = a.report_date || "";
        const dateB = b.report_date || "";
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        return (b.id || 0) - (a.id || 0);
      });

      // Find the most recent report matching the therapy type
      const normalizedType = (type || "").trim().toLowerCase();
      const match = reports.find(
        (r) => (r.therapy_type || "").trim().toLowerCase() === normalizedType
      );

      const defaultSections = getTherapySections(type);
      if (match && match.goals_achieved && typeof match.goals_achieved === "object") {
        // Pre-populate with previous goals (notes), but set response to ""
        const updatedGoals = { ...defaultSections };
        Object.entries(match.goals_achieved).forEach(([key, val]) => {
          if (updatedGoals[key]) {
            updatedGoals[key] = {
              ...updatedGoals[key],
              checked: val.checked || false,
              notes: val.notes || "",
              response: "", // Keep response empty for the new report
            };
          }
        });
        setGoalsAchieved(updatedGoals);
      } else {
        setGoalsAchieved(defaultSections);
      }
    } catch (err) {
      console.error("Failed to load previous goals:", err);
      setGoalsAchieved(getTherapySections(type));
    }
  };

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      const studentClassLabel = (
        student.class_name ||
        student.className ||
        ""
      ).toString();
      const matchesSearch =
        (student.name || "")
          .toLowerCase()
          .includes(studentSearch.toLowerCase()) ||
        studentClassLabel
          .toLowerCase()
          .includes(studentSearch.toLowerCase());

      const matchesClass =
        selectedClass === "all" ||
        studentClassLabel
          .toLowerCase()
          .includes(selectedClass.toLowerCase());

      return matchesSearch && matchesClass;
    });
  }, [students, studentSearch, selectedClass]);

  const hasStudentFilters =
    Boolean(studentSearch.trim()) || selectedClass !== "all";

  const emptyStudentMessage = hasStudentFilters
    ? "No students match your current filters."
    : "No students assigned.";

  // Update goals when therapy type changes
  useEffect(() => {
    setGoalsAchieved(getTherapySections(therapyType));
  }, [therapyType]);

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
        if (data?.specialization) {
          const spec = data.specialization;
          if (spec === "Physical Therapy") {
            setSpecialization("Physiotherapy");
          } else {
            setSpecialization(spec);
          }
        }
      } catch (err) {
        // silently fail and keep fallback
      }
    };

    fetchUser();
  }, []);

  // Fetch therapist-scoped students once; search/class filters are client-side.
  useEffect(() => {
    const fetchStudents = async () => {
      if (!userName) return;
      setStudentsLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/students/`, {
          params: { page: 1, page_size: 100 },
        });
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];

        const normalized = items.map((s) => ({
          ...s,
          photo_url: s.photo_url || s.photoUrl || null,
        }));

        const sortedStudents = [...normalized].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setStudents(sortedStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [userName]);

  useEffect(() => {
    if (!studentsLoading && students.length > 0) {
      const savedScroll = sessionStorage.getItem("th_scroll_pos");
      if (savedScroll !== null) {
        const y = parseInt(savedScroll, 10);
        setTimeout(() => {
          window.scrollTo(0, y);
          sessionStorage.removeItem("th_scroll_pos");
        }, 100);
      }
    }
  }, [studentsLoading, students]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleStudentClick = (studentId) => {
    sessionStorage.setItem("th_scroll_pos", String(window.scrollY));
    sessionStorage.setItem("th_studentSearch", studentSearch);
    sessionStorage.setItem("th_selectedClass", selectedClass);
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
        <p className="text-[#6F6C8F] mt-2">View and Manage Students</p>
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
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isSearchFloating ? "translate-y-0" : "-translate-y-full"
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
                  className="px-3 sm:px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg text-[13px] sm:text-base whitespace-nowrap"
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
                  Filter
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${showFilterDropdown ? "rotate-180" : ""
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
            {studentsLoading ? (
              <div className="text-center text-[#6F6C8F]">
                Loading students...
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="text-center text-[#6F6C8F]">
                {emptyStudentMessage}
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
                          {student.division || "-"}
                        </p>
                        <p className="text-sm text-[#6F6C8F]">
                          <span className="font-medium">Roll No:</span>{" "}
                          {student.roll_no || student.rollNo || "-"}
                        </p>
                      </div>
                    </div>
                    {/* Enter Report button */}
                    <button
                      className="px-4 py-2 bg-[#E38B52] text-white rounded-lg shadow-md hover:bg-[#E38B52]/90 transition-transform hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(student);
                        setShowReportDialog(true);
                        setReportDate(new Date().toISOString().slice(0, 10));
                        const initialType = specialization || "Speech Therapy";
                        setTherapyType(initialType);
                        setProgressLevel("Excellent");
                        setUnlockedGoals({});
                        loadPreviousGoals(student.id, initialType);
                      }}
                    >
                      Enter Report
                    </button>
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

        </div>
      </div>

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

      {showReportDialog && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => {
                setShowReportDialog(false);
                setSubmitError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close dialog"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-[#170F49] mb-4 text-center">
              Therapy Report for {selectedStudent.name}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setSubmitError(null);

                try {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    setSubmitError(
                      "Authentication token not found. Please log in again.",
                    );
                    setIsSubmitting(false);
                    return;
                  }

                  const payload = {
                    student_id: selectedStudent.id,
                    report_date: reportDate,
                    therapy_type: therapyType,
                    present_complaints: presentComplaints?.trim() || null,
                    current_observation: currentObservation?.trim() || null,
                    assessment_done: assessmentDone?.trim() || null,
                    provisional_diagnosis: provisionalDiagnosis?.trim() || null,
                    goals_achieved: goalsAchieved,
                    progress_level: progressLevel,
                  };

                  const response = await axios.post(
                    `${API_BASE_URL}/api/v1/therapy-reports/`,
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  // Delete local draft upon successful save
                  localStorage.removeItem(`draft_therapy_report_${selectedStudent.id}`);

                  setReportDate(new Date().toISOString().slice(0, 10));
                  const defaultType = specialization || "Speech Therapy";
                  setTherapyType(defaultType);
                  setGoalsAchieved(getTherapySections(defaultType));
                  setUnlockedGoals({});
                  setProgressLevel("Excellent");
                  setPresentComplaints("");
                  setCurrentObservation("");
                  setAssessmentDone("");
                  setProvisionalDiagnosis("");
                  setShowReportDialog(false);
                  setShowSuccessModal(true);

                  setTimeout(() => setShowSuccessModal(false), 3000);
                } catch (err) {
                  console.error("Failed to save report:", err);

                  // Save draft if authentication expired/failed
                  const isAuthError = err.response?.status === 401 || err.response?.status === 403 || 
                                      String(err.response?.data?.detail).toLowerCase().includes("credentials") ||
                                      String(err.message).toLowerCase().includes("credentials");
                  if (isAuthError) {
                    const draftKey = `draft_therapy_report_${selectedStudent.id}`;
                    const draftData = {
                      reportDate,
                      therapyType,
                      presentComplaints,
                      currentObservation,
                      assessmentDone,
                      provisionalDiagnosis,
                      goalsAchieved,
                      progressLevel,
                    };
                    localStorage.setItem(draftKey, JSON.stringify(draftData));
                    showToast("Session expired! Your report draft has been saved locally.", "error");
                  }

                  const errorMessage =
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to save report. Please try again.";
                  setSubmitError(errorMessage);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Therapy Type
                </label>
                <select
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] disabled:bg-gray-100 disabled:opacity-75"
                  value={therapyType}
                  disabled={Boolean(specialization)}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setTherapyType(newType);
                    setUnlockedGoals({});
                    loadPreviousGoals(selectedStudent.id, newType);
                  }}
                >
                  <option value="Speech Therapy">Speech Therapy</option>
                  <option value="Behavioral Therapy">Behavioral Therapy</option>
                  <option value="Occupational Therapy">
                    Occupational Therapy
                  </option>
                  <option value="Physiotherapy">Physiotherapy</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Present Complaints
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={presentComplaints}
                  onChange={(e) => setPresentComplaints(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Current Observation
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={currentObservation}
                  onChange={(e) => setCurrentObservation(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Assessment Done
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={assessmentDone}
                  onChange={(e) => setAssessmentDone(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Provisional Diagnosis
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-3">
                  Goals Addressed
                </label>
                <div className="space-y-4">
                  {Object.entries(goalsAchieved).map(([goalKey, goalData]) => (
                    <div
                      key={goalKey}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={goalKey}
                          checked={goalData.checked}
                          onChange={(e) =>
                            setGoalsAchieved({
                              ...goalsAchieved,
                              [goalKey]: {
                                ...goalsAchieved[goalKey],
                                checked: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 text-[#E38B52] rounded focus:ring-2 focus:ring-[#E38B52] cursor-pointer"
                        />
                        <label
                          htmlFor={goalKey}
                          className="ml-2 text-sm font-medium text-[#170F49] cursor-pointer"
                        >
                          {goalData.label}
                        </label>
                      </div>
                      <div className="mt-2 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-[#170F49]">
                              Goal
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setUnlockedGoals((prev) => ({
                                  ...prev,
                                  [goalKey]: !prev[goalKey],
                                }))
                              }
                              className="text-xs font-medium text-[#E38B52] hover:text-[#E38B52]/80 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
                            >
                              {unlockedGoals[goalKey] ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Lock Goal
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Edit Goal
                                </>
                              )}
                            </button>
                          </div>
                          {unlockedGoals[goalKey] ? (
                            <>
                              <textarea
                                placeholder="Enter goal details"
                                value={goalData.notes || ""}
                                onChange={(e) =>
                                  setGoalsAchieved({
                                    ...goalsAchieved,
                                    [goalKey]: {
                                      ...goalsAchieved[goalKey],
                                      notes: e.target.value.substring(0, 1000),
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 rounded border text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none resize-none bg-white"
                                rows="2"
                                maxLength="1000"
                              />
                              <div className="text-[10px] text-gray-500 mt-0.5 text-right">
                                {(goalData.notes || "").length}/1000
                              </div>
                            </>
                          ) : (
                            <div className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-gray-100 text-gray-700 min-h-[50px] whitespace-pre-wrap select-none leading-relaxed">
                              {goalData.notes ? (
                                goalData.notes
                              ) : (
                                <span className="text-gray-400 italic">No goal details set. Click "Edit Goal" to add.</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#170F49] mb-1">
                            Responses
                          </label>
                          <textarea
                            placeholder="Enter response or progress"
                            value={goalData.response || ""}
                            onChange={(e) =>
                              setGoalsAchieved({
                                ...goalsAchieved,
                                [goalKey]: {
                                  ...goalsAchieved[goalKey],
                                  response: e.target.value.substring(0, 1000),
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded border text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none resize-none"
                            rows="2"
                            maxLength="1000"
                          />
                          <div className="text-[10px] text-gray-500 mt-0.5 text-right">
                            {(goalData.response || "").length}/1000
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[#170F49] font-medium mb-1">
                  Progress Level
                </label>
                <select
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={progressLevel}
                  onChange={(e) => setProgressLevel(e.target.value)}
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Moderate</option>
                  <option>Needs Improvement</option>
                </select>
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-red-700 text-sm">{submitError}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => {
                    setShowReportDialog(false);
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#E38B52] text-white font-semibold shadow hover:bg-[#E38B52]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Saving...
                    </>
                  ) : (
                    "Save Report"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 transform animate-pulse">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#170F49] mb-2">
                Report Saved Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                The therapy report has been submitted and saved to the system.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-[#E38B52] text-white rounded-lg hover:bg-[#E38B52]/90 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-8 right-8 z-[9999] animate-slide-in-right ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            .animate-slide-in-right {
              animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="flex-shrink-0">
            {toast.type === "success" ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-grow font-semibold text-sm tracking-wide">
            {toast.message}
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="flex-shrink-0 text-xl font-bold hover:text-white/80 transition-colors cursor-pointer"
          >
            &times;
          </button>
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
           <p className="text-xs text-[#6F6C8F] mt-1">Therapist Portal</p>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-3">
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium bg-[#E38B52] text-white shadow-md">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             My Students
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center gap-16 sm:gap-24 items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-[60] px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button className="flex flex-col items-center justify-center w-20 h-16 transition text-[#E38B52]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[10px] mt-1 font-medium">My Students</span>
         </button>
         
         <div className="relative flex flex-col items-center justify-center w-20 h-16 group">
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
              <h1 className="text-xl font-bold text-[#170F49] font-baskervville">Therapist Portal</h1>
          </div>

          <div className="flex-1 w-full max-w-7xl mx-auto px-0 py-2 sm:p-4 z-10">
             <div className="relative bg-white/30 backdrop-blur-xl rounded-none sm:rounded-[24px] shadow-xl p-4 sm:p-6 border-y sm:border border-white/20 h-auto min-h-[50dvh] mb-6">

          {/* Filter and Search Section */}
          <div className="flex flex-row justify-between items-center mb-5 gap-3">
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
                  className="px-3 sm:px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg text-[13px] sm:text-base whitespace-nowrap"
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
                  Filter
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${showFilterDropdown ? "rotate-180" : ""
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
            {studentsLoading ? (
              <div className="text-center text-[#6F6C8F]">
                Loading students...
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="text-center text-[#6F6C8F]">
                {emptyStudentMessage}
              </div>
            ) : (
              visibleStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentClick(student.id)}
                  className="bg-white rounded-2xl py-2.5 px-3.5 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300 cursor-pointer mb-1.5"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 text-[#170F49]">
                    <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-lg overflow-hidden shrink-0">
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate pr-2">
                          {student.name}
                        </h3>
                        <span className="text-slate-300 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center text-[12px] sm:text-[13px] text-[#6F6C8F] truncate">
                        {student.class_name || student.className || "Unknown"}
                        <span className="mx-1.5 opacity-50">•</span>
                        Div {student.division || "-"}
                        <span className="mx-1.5 opacity-50">•</span>
                        Roll {student.roll_no || student.rollNo || "—"}
                      </div>
                      <div className="mt-2.5 sm:mt-3 flex justify-end">
                        <button
                          className="px-4 py-1.5 sm:px-5 sm:py-2 text-[13px] sm:text-sm font-semibold bg-[#E38B52] text-white rounded-xl shadow-sm hover:bg-[#E38B52]/90 transition-all hover:scale-[1.02]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setShowReportDialog(true);
                            setReportDate(new Date().toISOString().slice(0, 10));
                            const initialType = specialization || "Speech Therapy";
                            setTherapyType(initialType);
                            setProgressLevel("Excellent");
                            setUnlockedGoals({});
                            loadPreviousGoals(student.id, initialType);
                          }}
                        >
                          Enter Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

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

      {showReportDialog && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => {
                setShowReportDialog(false);
                setSubmitError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close dialog"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-[#170F49] mb-4 text-center">
              Therapy Report for {selectedStudent.name}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setSubmitError(null);

                try {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    setSubmitError(
                      "Authentication token not found. Please log in again.",
                    );
                    setIsSubmitting(false);
                    return;
                  }

                  const payload = {
                    student_id: selectedStudent.id,
                    report_date: reportDate,
                    therapy_type: therapyType,
                    present_complaints: presentComplaints?.trim() || null,
                    current_observation: currentObservation?.trim() || null,
                    assessment_done: assessmentDone?.trim() || null,
                    provisional_diagnosis: provisionalDiagnosis?.trim() || null,
                    goals_achieved: goalsAchieved,
                    progress_level: progressLevel,
                  };

                  const response = await axios.post(
                    `${API_BASE_URL}/api/v1/therapy-reports/`,
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  // Delete local draft upon successful save
                  localStorage.removeItem(`draft_therapy_report_${selectedStudent.id}`);

                  setReportDate(new Date().toISOString().slice(0, 10));
                  const defaultType = specialization || "Speech Therapy";
                  setTherapyType(defaultType);
                  setGoalsAchieved(getTherapySections(defaultType));
                  setUnlockedGoals({});
                  setProgressLevel("Excellent");
                  setPresentComplaints("");
                  setCurrentObservation("");
                  setAssessmentDone("");
                  setProvisionalDiagnosis("");
                  setShowReportDialog(false);
                  setShowSuccessModal(true);

                  setTimeout(() => setShowSuccessModal(false), 3000);
                } catch (err) {
                  console.error("Failed to save report:", err);

                  // Save draft if authentication expired/failed
                  const isAuthError = err.response?.status === 401 || err.response?.status === 403 || 
                                      String(err.response?.data?.detail).toLowerCase().includes("credentials") ||
                                      String(err.message).toLowerCase().includes("credentials");
                  if (isAuthError) {
                    const draftKey = `draft_therapy_report_${selectedStudent.id}`;
                    const draftData = {
                      reportDate,
                      therapyType,
                      presentComplaints,
                      currentObservation,
                      assessmentDone,
                      provisionalDiagnosis,
                      goalsAchieved,
                      progressLevel,
                    };
                    localStorage.setItem(draftKey, JSON.stringify(draftData));
                    showToast("Session expired! Your report draft has been saved locally.", "error");
                  }

                  const errorMessage =
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to save report. Please try again.";
                  setSubmitError(errorMessage);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Therapy Type
                </label>
                <select
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] disabled:bg-gray-100 disabled:opacity-75"
                  value={therapyType}
                  disabled={Boolean(specialization)}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setTherapyType(newType);
                    setUnlockedGoals({});
                    loadPreviousGoals(selectedStudent.id, newType);
                  }}
                >
                  <option value="Speech Therapy">Speech Therapy</option>
                  <option value="Behavioral Therapy">Behavioral Therapy</option>
                  <option value="Occupational Therapy">
                    Occupational Therapy
                  </option>
                  <option value="Physiotherapy">Physiotherapy</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Present Complaints
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={presentComplaints}
                  onChange={(e) => setPresentComplaints(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Current Observation
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={currentObservation}
                  onChange={(e) => setCurrentObservation(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Assessment Done
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={assessmentDone}
                  onChange={(e) => setAssessmentDone(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Provisional Diagnosis
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52] resize-none"
                  rows="2"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-3">
                  Goals Addressed
                </label>
                <div className="space-y-4">
                  {Object.entries(goalsAchieved).map(([goalKey, goalData]) => (
                    <div
                      key={goalKey}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={goalKey}
                          checked={goalData.checked}
                          onChange={(e) =>
                            setGoalsAchieved({
                              ...goalsAchieved,
                              [goalKey]: {
                                ...goalsAchieved[goalKey],
                                checked: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 text-[#E38B52] rounded focus:ring-2 focus:ring-[#E38B52] cursor-pointer"
                        />
                        <label
                          htmlFor={goalKey}
                          className="ml-2 text-sm font-medium text-[#170F49] cursor-pointer"
                        >
                          {goalData.label}
                        </label>
                      </div>
                      <div className="mt-2 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-[#170F49]">
                              Goal
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setUnlockedGoals((prev) => ({
                                  ...prev,
                                  [goalKey]: !prev[goalKey],
                                }))
                              }
                              className="text-xs font-medium text-[#E38B52] hover:text-[#E38B52]/80 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
                            >
                              {unlockedGoals[goalKey] ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Lock Goal
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Edit Goal
                                </>
                              )}
                            </button>
                          </div>
                          {unlockedGoals[goalKey] ? (
                            <>
                              <textarea
                                placeholder="Enter goal details"
                                value={goalData.notes || ""}
                                onChange={(e) =>
                                  setGoalsAchieved({
                                    ...goalsAchieved,
                                    [goalKey]: {
                                      ...goalsAchieved[goalKey],
                                      notes: e.target.value.substring(0, 1000),
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 rounded border text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none resize-none bg-white"
                                rows="2"
                                maxLength="1000"
                              />
                              <div className="text-[10px] text-gray-500 mt-0.5 text-right">
                                {(goalData.notes || "").length}/1000
                              </div>
                            </>
                          ) : (
                            <div className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-gray-100 text-gray-700 min-h-[50px] whitespace-pre-wrap select-none leading-relaxed">
                              {goalData.notes ? (
                                goalData.notes
                              ) : (
                                <span className="text-gray-400 italic">No goal details set. Click "Edit Goal" to add.</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#170F49] mb-1">
                            Responses
                          </label>
                          <textarea
                            placeholder="Enter response or progress"
                            value={goalData.response || ""}
                            onChange={(e) =>
                              setGoalsAchieved({
                                ...goalsAchieved,
                                [goalKey]: {
                                  ...goalsAchieved[goalKey],
                                  response: e.target.value.substring(0, 1000),
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded border text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none resize-none"
                            rows="2"
                            maxLength="1000"
                          />
                          <div className="text-[10px] text-gray-500 mt-0.5 text-right">
                            {(goalData.response || "").length}/1000
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[#170F49] font-medium mb-1">
                  Progress Level
                </label>
                <select
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={progressLevel}
                  onChange={(e) => setProgressLevel(e.target.value)}
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Moderate</option>
                  <option>Needs Improvement</option>
                </select>
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-red-700 text-sm">{submitError}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => {
                    setShowReportDialog(false);
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#E38B52] text-white font-semibold shadow hover:bg-[#E38B52]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Saving...
                    </>
                  ) : (
                    "Save Report"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 transform animate-pulse">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#170F49] mb-2">
                Report Saved Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                The therapy report has been submitted and saved to the system.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-[#E38B52] text-white rounded-lg hover:bg-[#E38B52]/90 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-8 right-8 z-[9999] animate-slide-in-right ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            .animate-slide-in-right {
              animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="flex-shrink-0">
            {toast.type === "success" ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-grow font-semibold text-sm tracking-wide">
            {toast.message}
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="flex-shrink-0 text-xl font-bold hover:text-white/80 transition-colors cursor-pointer"
          >
            &times;
          </button>
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

export default TherapistDashboard;
