import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import TherapistStudentAssignmentModal from "../components/TherapistStudentAssignmentModal.jsx";
import { AuthContext } from "../auth/AuthProvider.jsx";
import { useDebouncedValue } from "../utils/useDebouncedValue";

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

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      title="Back to Top"
      className={`fixed z-50 bottom-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-all duration-300
        ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        hover:scale-110 hover:bg-[#C8742F] focus:outline-none`}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
      aria-label="Back to Top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 19V5m0 0l-7 7m7-7l7 7"
        />
      </svg>
    </button>
  );
};

const HeadMaster = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin =
    Boolean(user?.is_superuser) ||
    ["admin", "hm", "headmaster"].includes(
      String(user?.role || "").toLowerCase(),
    );
  const [selectedClass, setSelectedClass] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const filterRef = useRef(null);
  const [isSearchFloating, setIsSearchFloating] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("headmistressActiveTab") || "students";
  });

  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherTotal, setTeacherTotal] = useState(0);
  const [teacherTotalPages, setTeacherTotalPages] = useState(1);
  const showDeleteSuccess = (message) => {
    setNotification({ message, type: "success" });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const debouncedTeacherSearch = useDebouncedValue(teacherSearch, 400);
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedStudentSearch = useDebouncedValue(studentSearch, 400);
  const [therapistSearch, setTherapistSearch] = useState("");
  const debouncedTherapistSearch = useDebouncedValue(therapistSearch, 400);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentPage, setStudentPage] = useState(1);
  const studentLimit = 50;
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [therapists, setTherapists] = useState([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [therapistPage, setTherapistPage] = useState(1);
  const [therapistTotal, setTherapistTotal] = useState(0);
  const [therapistTotalPages, setTherapistTotalPages] = useState(1);
  const therapistLimit = 50;
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [assignmentTherapist, setAssignmentTherapist] = useState(null);
  const studentSearchContainerRef = useRef(null);

  const teacherLimit = 50;

  const renderStudentPaginationControls = (className = "") =>
    renderPaginationControls({
      page: studentPage,
      totalPages: studentTotalPages,
      totalItems: studentTotal,
      setPage: setStudentPage,
      itemLabel: "students",
      className,
      hidden: studentsLoading || students.length === 0,
    });

  const renderPaginationControls = ({
    page,
    totalPages,
    totalItems,
    setPage,
    itemLabel,
    className = "",
    hidden = false,
  }) => {
    if (hidden) return null;

    return (
      <div className={`flex items-center justify-center gap-4 px-4 py-6 border-t border-gray-200 ${className}`}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className={`px-4 py-2 rounded-lg border border-[#E38B52] transition-all font-medium ${
            page <= 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-white text-[#E38B52] hover:bg-[#E38B52] hover:text-white'
          }`}
        >
          ◀ Previous
        </button>

        <div className="text-sm text-[#6F6C8F] font-medium whitespace-nowrap">
          Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> — <span className="font-bold">{totalItems}</span> {itemLabel}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages || p + 1, p + 1))}
          disabled={page >= totalPages}
          className={`px-4 py-2 rounded-lg border border-[#E38B52] transition-all font-medium ${
            page >= totalPages
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-white text-[#E38B52] hover:bg-[#E38B52] hover:text-white'
          }`}
        >
          Next ▶
        </button>
      </div>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      const searchBarPosition = studentSearchContainerRef.current?.getBoundingClientRect().top;
      if (searchBarPosition < 0) {
        setIsSearchFloating(true);
      } else {
        setIsSearchFloating(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const classSet = new Set();
    CLASS_OPTIONS.forEach((className) => classSet.add(className));
    students.forEach((s) => {
      if (s.class_name) classSet.add(s.class_name);
    });
    const derived = Array.from(classSet).sort();
    setClassesList(derived);

    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [students]);

  useEffect(() => {
    const fetchTeachers = async () => {
      setTeachersLoading(true);
      try {
        const params = {
          page: teacherPage,
          limit: teacherLimit,
        };
        if (debouncedTeacherSearch && debouncedTeacherSearch.trim()) {
          params.search = debouncedTeacherSearch.trim();
        }
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/teachers/`, { params });
        const items = Array.isArray(data?.items) ? data.items : [];
        setTeacherTotal(data?.total ?? 0);
        setTeacherTotalPages(data?.total_pages ?? 1);
        const sortedTeachers = [...items].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setTeachers(sortedTeachers);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        setTeachersLoading(false);
      }
    };

    if (activeTab === "teachers") {
      fetchTeachers();
    }
  }, [activeTab, debouncedTeacherSearch, teacherPage, teacherLimit]);

  useEffect(() => {
    const fetchTherapists = async () => {
      setTherapistsLoading(true);
      try {
        const params = {
          page: therapistPage,
          limit: therapistLimit,
        };
        if (debouncedTherapistSearch && debouncedTherapistSearch.trim()) {
          params.search = debouncedTherapistSearch.trim();
        }
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/therapists/`, { params });
        const items = Array.isArray(data?.items) ? data.items : [];
        setTherapistTotal(data?.total ?? 0);
        setTherapistTotalPages(data?.total_pages ?? 1);
        const sortedTherapists = [...items].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setTherapists(sortedTherapists);
      } catch (error) {
        console.error("Error fetching therapists:", error);
      } finally {
        setTherapistsLoading(false);
      }
    };

    if (activeTab === "therapists") {
      fetchTherapists();
    }
  }, [activeTab, debouncedTherapistSearch, therapistPage, therapistLimit]);

  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const params = {
          page: studentPage,
          limit: studentLimit,
        };
        if (debouncedStudentSearch && debouncedStudentSearch.trim()) {
          params.search = debouncedStudentSearch.trim();
        }
        if (selectedClass && selectedClass !== "all") params.class_name = selectedClass;
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/students/`, { params });
        const items = Array.isArray(data?.items) ? data.items : [];
        setStudentTotal(data?.total ?? 0);
        setStudentTotalPages(data?.total_pages ?? data?.pages ?? 1);

        const normalized = items.map((s) => ({ ...s, photo_url: s.photo_url || s.photoUrl || null }));
        const sortedStudents = [...normalized].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setStudents(sortedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setStudentsLoading(false);
      }
    };
    if (activeTab === "students") {
      fetchStudents();
    }
  }, [activeTab, debouncedStudentSearch, selectedClass, studentPage, studentLimit]);

  useEffect(() => {
    setStudentPage(1);
  }, [debouncedStudentSearch, selectedClass]);

  useEffect(() => {
    setTeacherPage(1);
  }, [debouncedTeacherSearch]);

  useEffect(() => {
    setTherapistPage(1);
  }, [debouncedTherapistSearch]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleAddStudent = () => { navigate("/add-student"); };
  const handleAddTeacher = () => { navigate("/add-teacher"); };
  const handleAddTherapist = () => { navigate("/add-therapist"); };
  const handleStudentClick = (studentId) => { navigate(`/student/${studentId}`); };
  const handleTeacherClick = (teacherId) => { navigate(`/teacher/${teacherId}`); };
  const handleTherapistClick = (therapistId) => { navigate(`/therapist/${therapistId}`); };

  const handleAssignStudentsClick = (therapist, event) => {
    event.stopPropagation();
    if (!isAdmin) return;
    setAssignmentTherapist(therapist);
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setAssignmentTherapist(null);
  };

  const handleAddUserClick = () => { navigate("/add-user"); };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    setTeacherToDelete({ id: teacherId, name: teacherName });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/v1/teachers/${teacherToDelete.id}`);
      if (response.status === 200 || response.status === 204) {
        setTeachers(teachers.filter((teacher) => teacher.id !== teacherToDelete.id));
        showDeleteSuccess(`${teacherToDelete.name} has been deleted.`);
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setNotification({ message: "Failed to delete teacher. Please try again.", type: "error" });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    } finally {
      setShowDeleteConfirm(false);
      setTeacherToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTeacherToDelete(null);
  };

  const [showStudentDeleteConfirm, setShowStudentDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showTherapistDeleteConfirm, setShowTherapistDeleteConfirm] = useState(false);
  const [therapistToDelete, setTherapistToDelete] = useState(null);

  const handleDeleteStudent = (studentId, studentName) => {
    setStudentToDelete({ id: studentId, name: studentName });
    setShowStudentDeleteConfirm(true);
  };

  const handleDeleteTherapist = (therapistId, therapistName) => {
    setTherapistToDelete({ id: therapistId, name: therapistName });
    setShowTherapistDeleteConfirm(true);
  };

  const confirmDeleteTherapist = async () => {
    if (!therapistToDelete) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/v1/therapists/${therapistToDelete.id}`);
      if (response.status === 200 || response.status === 204) {
        setTherapists(therapists.filter((therapist) => therapist.id !== therapistToDelete.id));
        showDeleteSuccess(`${therapistToDelete.name} has been deleted.`);
      }
    } catch (error) {
      console.error("Error deleting therapist:", error);
      setNotification({ message: "Failed to delete therapist. Please try again.", type: "error" });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    } finally {
      setShowTherapistDeleteConfirm(false);
      setTherapistToDelete(null);
    }
  };

  const cancelDeleteTherapist = () => {
    setShowTherapistDeleteConfirm(false);
    setTherapistToDelete(null);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/students/${studentToDelete.id}`);
      setStudents(students.filter((student) => student.id !== studentToDelete.id));
      showDeleteSuccess(`${studentToDelete.name} has been deleted.`);
    } catch (error) {
      console.error("Error deleting student:", error);
      setNotification({ message: "Failed to delete student.", type: "error" });
    } finally {
      setShowStudentDeleteConfirm(false);
      setStudentToDelete(null);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    }
  };

  const cancelDeleteStudent = () => {
    setShowStudentDeleteConfirm(false);
    setStudentToDelete(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-x-hidden py-20">
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>
      </div>

      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={handleAddUserClick}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Add User
        </button>
      </div>

      <div className="text-center mb-12 z-10">
        <h1 className="text-4xl font-bold text-[#170F49] font-baskervville">Headmistress's Page</h1>
        <p className="text-[#6F6C8F] mt-2">Manage Students and Teachers</p>
      </div>

      <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isSearchFloating ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="backdrop-blur-xl p-4">
          <div className="w-[90%] max-w-[1200px] mx-auto">
            <div className="relative w-full md:w-[443px] mx-auto">
              <input
                type="text"
                placeholder={`Search ${activeTab === "students" ? "students" : activeTab === "teachers" ? "teachers" : "therapists"}...`}
                className="w-full pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                value={activeTab === "students" ? studentSearch : activeTab === "teachers" ? teacherSearch : therapistSearch}
                onChange={(e) => {
                  if (activeTab === "students") {
                    setStudentSearch(e.target.value);
                  } else if (activeTab === "teachers") {
                    setTeacherSearch(e.target.value);
                  } else {
                    setTherapistSearch(e.target.value);
                  }
                }}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              {(activeTab === "students" ? studentSearch : activeTab === "teachers" ? teacherSearch : therapistSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "students") {
                      setStudentSearch("");
                    } else if (activeTab === "teachers") {
                      setTeacherSearch("");
                    } else {
                      setTherapistSearch("");
                    }
                  }}
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

      <div className="fixed top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="fixed -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />

      <div className="w-[90%] max-w-[1200px] mx-4 z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative">
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left: activeTab === "students" ? "4px" : activeTab === "teachers" ? "calc(33.33% + 2px)" : "calc(66.66% + 0px)",
                width: "calc(33.33% - 6px)",
                background: "linear-gradient(135deg, #E38B52 0%, #E38B52 100%)",
              }}
            >
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="particle-1"></div>
                <div className="particle-2"></div>
                <div className="particle-3"></div>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab("students"); localStorage.setItem("headmistressActiveTab", "students"); }}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${activeTab === "students" ? "text-white scale-105" : "text-[#170F49] hover:text-[#E38B52]"}`}
            >
              Students List
            </button>

            <button
              onClick={() => { setActiveTab("teachers"); localStorage.setItem("headmistressActiveTab", "teachers"); }}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${activeTab === "teachers" ? "text-white scale-105" : "text-[#170F49] hover:text-[#E38B52]"}`}
            >
              Teachers List
            </button>

            <button
              onClick={() => { setActiveTab("therapists"); localStorage.setItem("headmistressActiveTab", "therapists"); }}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${activeTab === "therapists" ? "text-white scale-105" : "text-[#170F49] hover:text-[#E38B52]"}`}
            >
              Therapists List
            </button>
          </div>
        </div>

        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "students" ? (
            <>
              <div className="flex justify-between items-center mb-8 px-4">
                <div ref={studentSearchContainerRef} id="search-container" className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-[443px] pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
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
                  <button
                    onClick={handleAddStudent}
                    className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Student
                  </button>

                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterDropdown((s) => !s)}
                      className="px-4 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                      aria-haspopup="listbox"
                      aria-expanded={showFilterDropdown}
                      aria-label="Filter students by class"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{selectedClass === "all" ? "Filter" : selectedClass}</span>
                    </button>

                    {showFilterDropdown && (
                      <div className="absolute right-0 mt-2 w-52 bg-[#FAF9F6] rounded-xl shadow-lg overflow-hidden z-50">
                        <ul className="p-2 space-y-2" role="listbox" aria-label="Class filter options">
                          <li>
                            <button
                              onClick={() => { setSelectedClass("all"); setShowFilterDropdown(false); }}
                              className={`w-full text-left px-4 py-2 rounded-lg hover:bg-[#E38B52]/10 ${selectedClass === "all" ? "font-semibold" : ""}`}
                            >
                              All Students
                            </button>
                          </li>
                          {classesList.length === 0 ? (
                            CLASS_OPTIONS.map((c) => (
                              <li key={c}>
                                <button
                                  onClick={() => { setSelectedClass(c); setShowFilterDropdown(false); }}
                                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-[#E38B52]/10 ${selectedClass === c ? "font-semibold" : ""}`}
                                >
                                  {c}
                                </button>
                              </li>
                            ))
                          ) : (
                            classesList.map((c) => (
                              <li key={c}>
                                <button
                                  onClick={() => { setSelectedClass(c); setShowFilterDropdown(false); }}
                                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-[#E38B52]/10 ${selectedClass === c ? "font-semibold" : ""}`}
                                >
                                  {c}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {renderStudentPaginationControls("mb-8")}

              <div className="grid grid-cols-1 gap-4 px-4">
                {studentsLoading && <div className="text-center text-[#6F6C8F]">Loading students...</div>}
                {!studentsLoading && students.length === 0 && <div className="text-center text-[#6F6C8F]">No students found.</div>}
                {!studentsLoading &&
                  students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentClick(student.id)}
                      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 text-[#170F49]">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img
                            src={student.photo_url || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(student.name || "S")}&size=250&background=EFEFEF&color=170F49`}
                            alt={student.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://placehold.co/64x64/EFEFEF/AAAAAA?text=Photo"; }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#170F49]">{student.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Class:</span> {student.class_name || "-"}</p>
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Division:</span> {student.division || "-"}</p>
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Roll No:</span> {student.roll_no || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-[#E38B52] hover:text-[#E38B52]/90 rounded-lg transition-colors"
                            title="View Student Profile"
                            onClick={(e) => { e.stopPropagation(); handleStudentClick(student.id); }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-[rgba(227,139,82,0.2)] rounded-lg transition-colors"
                            title="Delete Student"
                            onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id, student.name); }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : activeTab === "teachers" ? (
            <>
              <div className="flex justify-between items-center mb-8 px-4">
                <div id="search-container" className="relative">
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    className="w-[443px] pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  {teacherSearch && (
                    <button
                      type="button"
                      onClick={() => setTeacherSearch("")}
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

                <button
                  onClick={handleAddTeacher}
                  className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Teacher
                </button>
              </div>

              {renderPaginationControls({
                page: teacherPage,
                totalPages: teacherTotalPages,
                totalItems: teacherTotal,
                setPage: setTeacherPage,
                itemLabel: "teachers",
                className: "mb-8",
                hidden: teachersLoading || teachers.length === 0,
              })}

              <div className="grid grid-cols-1 gap-4 px-4">
                {teachersLoading ? (
                  <div className="text-center text-[#6F6C8F]">Loading teachers...</div>
                ) : teachers.length === 0 ? (
                  <div className="text-center text-[#6F6C8F]">No teachers found.</div>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      onClick={() => handleTeacherClick(teacher.id)}
                      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 text-[#170F49]">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img src={`https://eu.ui-avatars.com/api/?name=${teacher.name.replace(" ", "+")}&size=250`} alt="Teacher" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#170F49]">{teacher.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Mobile:</span> {teacher.mobile_number}</p>
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Qualifications:</span> {teacher.qualifications_details}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTeacherClick(teacher.id)}
                            className="text-[#E38B52] hover:text-[#E38B52]/90 transition-colors p-2 rounded-lg hover:bg-[#E38B52]/10"
                            title="View Teacher Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(teacher.id, teacher.name); }}
                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-[rgba(227,139,82,0.2)]"
                            title="Delete Teacher"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : activeTab === "therapists" ? (
            <>
              <div className="flex justify-between items-center mb-8 px-4">
                <div id="search-container" className="relative">
                  <input
                    type="text"
                    placeholder="Search therapists..."
                    className="w-[443px] pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                    value={therapistSearch}
                    onChange={(e) => setTherapistSearch(e.target.value)}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  {therapistSearch && (
                    <button
                      type="button"
                      onClick={() => setTherapistSearch("")}
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

                <button
                  onClick={handleAddTherapist}
                  className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Therapist
                </button>
              </div>

              {renderPaginationControls({
                page: therapistPage,
                totalPages: therapistTotalPages,
                totalItems: therapistTotal,
                setPage: setTherapistPage,
                itemLabel: "therapists",
                className: "mb-8",
                hidden: therapistsLoading || therapists.length === 0,
              })}

              <div className="grid grid-cols-1 gap-4 px-4">
                {therapistsLoading ? (
                  <div className="text-center text-[#6F6C8F]">Loading therapists...</div>
                ) : therapists.length === 0 ? (
                  <div className="text-center text-[#6F6C8F]">No therapists found.</div>
                ) : (
                  therapists.map((therapist) => (
                    <div
                      key={therapist.id}
                      onClick={() => handleTherapistClick(therapist.id)}
                      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 text-[#170F49]">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img src={`https://eu.ui-avatars.com/api/?name=${therapist.name.replace(" ", "+")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#170F49]">{therapist.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Mobile:</span> {therapist.mobile_number}</p>
                            {therapist.specialization && <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Specialization:</span> {therapist.specialization}</p>}
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Qualifications:</span> {therapist.qualifications_details}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTherapistClick(therapist.id)}
                            className="text-[#E38B52] hover:text-[#E38B52]/90 transition-colors p-2 rounded-lg hover:bg-[#E38B52]/10"
                            title="View Therapist Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(event) => handleAssignStudentsClick(therapist, event)}
                              className="px-4 py-2 rounded-lg border border-[#E38B52] text-sm font-semibold text-[#E38B52] bg-white hover:bg-[#E38B52] hover:text-white transition-colors"
                              title="Assign Students"
                            >
                              Assign Students
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTherapist(therapist.id, therapist.name); }}
                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-[rgba(227,139,82,0.2)]"
                            title="Delete Therapist"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(100px, -100px) scale(1.2); }
          50% { transform: translate(0, 100px) scale(0.9); }
          75% { transform: translate(-100px, -50px) scale(1.1); }
        }
        .animate-float { animation: float 15s infinite ease-in-out; }
        .animation-delay-3000 { animation-delay: -5s; }
        .animation-delay-5000 { animation-delay: -10s; }
        .scrollbar-thin::-webkit-scrollbar { width: 10px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e38b52; border-radius: 5px; }
        .scrollbar-thin { scrollbar-width: auto; scrollbar-color: #e38b52 transparent; }
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(var(--tx), var(--ty)) scale(0.8); }
        }
        .particle-1, .particle-2, .particle-3 { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); pointer-events: none; }
        .particle-1 { top: 20%; left: 20%; --tx: 10px; --ty: -10px; animation: float-particle 3s infinite ease-in-out; }
        .particle-2 { top: 50%; right: 20%; --tx: -15px; --ty: 5px; animation: float-particle 4s infinite ease-in-out; }
        .particle-3 { bottom: 20%; left: 50%; --tx: 5px; --ty: 15px; animation: float-particle 5s infinite ease-in-out; }
      `}</style>

      <DeleteConfirmationModal open={showDeleteConfirm} title="Delete Teacher" entityName={teacherToDelete?.name || "this teacher"} entityType="teacher" onCancel={cancelDelete} onConfirm={confirmDelete} />
      <DeleteConfirmationModal open={showStudentDeleteConfirm} title="Delete Student" entityName={studentToDelete?.name || "this student"} entityType="student" onCancel={cancelDeleteStudent} onConfirm={confirmDeleteStudent} />
      <DeleteConfirmationModal open={showTherapistDeleteConfirm} title="Delete Therapist" entityName={therapistToDelete?.name || "this therapist"} entityType="therapist" onCancel={cancelDeleteTherapist} onConfirm={confirmDeleteTherapist} />

      {isAdmin && (
        <TherapistStudentAssignmentModal
          open={showAssignmentModal}
          therapist={assignmentTherapist}
          classOptions={classesList}
          onClose={closeAssignmentModal}
          onSaved={() => {
            setNotification({ message: `Student assignments updated for ${assignmentTherapist?.name || "therapist"}.`, type: "success" });
            setTimeout(() => setNotification({ message: "", type: "" }), 3000);
          }}
        />
      )}

      {notification.message && (
        <div className={`fixed top-8 right-8 z-50 text-white px-6 py-3 rounded-xl shadow-lg transition-transform transform-gpu animate-fade-in-down ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          <div className="flex items-center gap-3">
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <ScrollToTopButton />

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
  );
};

export default HeadMaster;