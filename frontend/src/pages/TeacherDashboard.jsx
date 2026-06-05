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

// Helper function to get therapy-specific sections
const getTherapySections = (therapyType) => {
  const sections = {
    "Speech Therapy": {
      receptive_language: {
        checked: false,
        notes: "",
        label: "Receptive Language Skills (Comprehension)",
      },
      expressive_language: {
        checked: false,
        notes: "",
        label: "Expressive Language Skills",
      },
      oral_motor_opt: {
        checked: false,
        notes: "",
        label: "Oral Motor & Oral Placement Therapy (OPT) Goals",
      },
      pragmatic_language: {
        checked: false,
        notes: "",
        label: "Pragmatic Language Skills (Social Communication)",
      },
      narrative_skills: {
        checked: false,
        notes: "",
        label: "Narrative Skills",
      },
    },
    "Behavioral Therapy": {
      behavior_regulation: {
        checked: false,
        notes: "",
        label: "Behavior Regulation & Self-Control",
      },
      attention_compliance: {
        checked: false,
        notes: "",
        label: "Attention, Compliance & Task Engagement",
      },
      emotional_regulation: {
        checked: false,
        notes: "",
        label: "Emotional Regulation Skills",
      },
      social_behavior: {
        checked: false,
        notes: "",
        label: "Social Behavior & Interaction Skills",
      },
      adaptive_behavior: {
        checked: false,
        notes: "",
        label: "Adaptive Behavior & Functional Skills",
      },
    },
    "Cognitive Therapy": {
      attention_concentration: {
        checked: false,
        notes: "",
        label: "Attention & Concentration Skills",
      },
      memory_recall: {
        checked: false,
        notes: "",
        label: "Memory & Recall Skills",
      },
      problem_solving: {
        checked: false,
        notes: "",
        label: "Problem Solving & Reasoning Skills",
      },
      executive_functioning: {
        checked: false,
        notes: "",
        label: "Executive Functioning Skills",
      },
      cognitive_flexibility: {
        checked: false,
        notes: "",
        label: "Cognitive Flexibility & Processing Skills",
      },
    },
    "Occupational Therapy": {
      daily_living_adl: {
        checked: false,
        notes: "",
        label: "Activities of Daily Living (ADL)",
      },
      sensory_integration_modulation: {
        checked: false,
        notes: "",
        label: "Sensory Integration and Modulation",
      },
      neuro_cognitive_rehabilitation: {
        checked: false,
        notes: "",
        label: "Neuro-Cognitive Rehabilitation",
      },
      fine_motor_hand_function: {
        checked: false,
        notes: "",
        label: "Fine Motor and Hand Function",
      },
      gross_motor_coordination_balance: {
        checked: false,
        notes: "",
        label: "Gross Motor Coordination and Balance",
      },
      psychosocial_behavioral_regulation: {
        checked: false,
        notes: "",
        label: "Psychosocial and Behavioral Regulation",
      },
      handwriting_pre_academics: {
        checked: false,
        notes: "",
        label: "Handwriting and Pre-Academics",
      },
    },
    Physiotherapy: {
      gross_motor: { checked: false, notes: "", label: "Gross Motor Skills" },
      balance_postural: {
        checked: false,
        notes: "",
        label: "Balance & Postural Control",
      },
      strength_endurance: {
        checked: false,
        notes: "",
        label: "Strength & Endurance",
      },
      coordination_planning: {
        checked: false,
        notes: "",
        label: "Coordination & Motor Planning",
      },
      functional_mobility: {
        checked: false,
        notes: "",
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

  // Define goals for each therapy type
  const getGoalsForTherapyType = (therapy) => {
    const goalsMap = {
      "Behavioral Therapy": {
        behavioral_management: {
          checked: false,
          notes: "",
          label: "Behavioral Management",
        },
        emotional_regulation: {
          checked: false,
          notes: "",
          label: "Emotional Regulation",
        },
        social_skills: { checked: false, notes: "", label: "Social Skills" },
        coping_strategies: {
          checked: false,
          notes: "",
          label: "Coping Strategies",
        },
      },
      "Occupational Therapy": {
        daily_living_activities: {
          checked: false,
          notes: "",
          label: "Activities of Daily Living (ADL)",
        },
        sensory_integration_modulation: {
          checked: false,
          notes: "",
          label: "Sensory Integration & Modulation",
        },
        neuro_cognitive_rehab: {
          checked: false,
          notes: "",
          label: "Neuro-cognitive Rehabilitation",
        },
        fine_motor_and_hand: {
          checked: false,
          notes: "",
          label: "Fine Motor & Hand Function",
        },
        gross_motor_coordination: {
          checked: false,
          notes: "",
          label: "Gross Motor Coordination & Balance",
        },
        psychosocial_behavioral_regulation: {
          checked: false,
          notes: "",
          label: "Psychosocial & Behavioral Regulation",
        },
        handwriting_pre_academic: {
          checked: false,
          notes: "",
          label: "Handwriting & Pre-Academic Skills",
        },
      },
      Physiotherapy: {
        strength_endurance: {
          checked: false,
          notes: "",
          label: "Strength & Endurance",
        },
        flexibility_range: {
          checked: false,
          notes: "",
          label: "Flexibility & Range of Motion",
        },
        balance_coordination: {
          checked: false,
          notes: "",
          label: "Balance & Coordination",
        },
        mobility_gait: { checked: false, notes: "", label: "Mobility & Gait" },
      },
      "Speech Therapy": {
        receptive_language: {
          checked: false,
          notes: "",
          label: "Receptive Language Skills (Comprehension)",
        },
        expressive_language: {
          checked: false,
          notes: "",
          label: "Expressive Language Skills",
        },
        oral_motor_opt: {
          checked: false,
          notes: "",
          label: "Oral Motor & Oral Placement Therapy (OPT) Goals",
        },
        pragmatic_language: {
          checked: false,
          notes: "",
          label: "Pragmatic Language Skills (Social Communication)",
        },
        narrative_skills: {
          checked: false,
          notes: "",
          label: "Narrative Skills",
        },
      },
    };
    return goalsMap[therapy] || goalsMap["Speech Therapy"];
  };

  const [goalsAchieved, setGoalsAchieved] = useState(
    getGoalsForTherapyType("Occupational Therapy"),
  );
  const [progressLevel, setProgressLevel] = useState("Excellent");

  // NEW CLINICAL FIELD STATES
  const [presentComplaints, setPresentComplaints] = useState("");
  const [currentObservation, setCurrentObservation] = useState("");
  const [assessmentDone, setAssessmentDone] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [activeTab, setActiveTab] = useState("students");
  const [filterOption, setFilterOption] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isSearchFloating, setIsSearchFloating] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
        if (data?.username) setUserName(data.username);
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
        setAllStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [userName]);

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
    try {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } catch (e) {}
    navigate('/login');
  };

  const handleStudentClick = (studentId) => {
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
              d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
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
                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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
                className="w-[443px] pl-10 pr-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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
            {studentsLoading ? (
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
                      {/* Enter Report button */}
                      <button
                        className="px-4 py-2 bg-[#E38B52] text-white rounded-lg shadow-md hover:bg-[#E38B52]/90 transition-transform hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setShowReportDialog(true);
                          setReportDate(new Date().toISOString().slice(0, 10));
                          setTherapyType("Speech Therapy");
                          setProgressLevel("Excellent");

                          // RESET CLINICAL FIELDS
                          setPresentComplaints("");
                          setCurrentObservation("");
                          setAssessmentDone("");
                          setProvisionalDiagnosis("");
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
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#170F49]">{therapist.name || "-"}</h3>
                        <p className="text-sm text-[#6F6C8F]">Specialization: {therapist.specialization || "-"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignStudents(therapist)}
                        className="px-4 py-2 bg-[#E38B52] text-white rounded-lg shadow-md hover:bg-[#E38B52]/90 transition-transform hover:scale-105"
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

      {showReportDialog && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                    // ADDED NEW CLINICAL FIELDS TO PAYLOAD
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

                  setReportDate(new Date().toISOString().slice(0, 10));
                  const defaultType = "Speech Therapy";
                  setTherapyType(defaultType);
                  setGoalsAchieved(getTherapySections(defaultType));
                  setProgressLevel("Excellent");

                  // RESET CLINICAL FIELDS AFTER SUCCESS
                  setPresentComplaints("");
                  setCurrentObservation("");
                  setAssessmentDone("");
                  setProvisionalDiagnosis("");

                  setShowReportDialog(false);
                  setShowSuccessModal(true);

                  setTimeout(() => setShowSuccessModal(false), 3000);
                } catch (err) {
                  console.error("Failed to save report:", err);
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
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={therapyType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setTherapyType(newType);
                    setGoalsAchieved(getTherapySections(newType));
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

              {/* ----- NEW CLINICAL FIELDS ADDED HERE ----- */}
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
              {/* ------------------------------------------- */}

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
                      <textarea
                        placeholder="Describe progress (2-3 sentences)"
                        value={goalData.notes}
                        onChange={(e) =>
                          setGoalsAchieved({
                            ...goalsAchieved,
                            [goalKey]: {
                              ...goalsAchieved[goalKey],
                              notes: e.target.value.substring(0, 250),
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded border text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none resize-none"
                        rows="2"
                        maxLength="250"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {goalData.notes.length}/250
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
    </div>
  );
};

export default TherapistDashboard;
