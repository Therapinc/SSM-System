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
      className={`fixed z-50 bottom-8 right-8 max-md:bottom-[calc(90px+env(safe-area-inset-bottom))] w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-all duration-300
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
  const [selectedClass, setSelectedClass] = useState(
    () => sessionStorage.getItem("hm_selectedClass") || "all",
  );
  const [selectedDivision, setSelectedDivision] = useState(
    () => sessionStorage.getItem("hm_selectedDivision") || "all",
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const filterRef = useRef(null);
  const divisionRef = useRef(null);
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
  const [studentSearch, setStudentSearch] = useState(
    () => sessionStorage.getItem("hm_studentSearch") || "",
  );
  const debouncedStudentSearch = useDebouncedValue(studentSearch, 400);
  const [therapistSearch, setTherapistSearch] = useState("");
  const debouncedTherapistSearch = useDebouncedValue(therapistSearch, 400);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentPage, setStudentPage] = useState(() => {
    const p = sessionStorage.getItem("hm_studentPage");
    return p ? parseInt(p, 10) : 1;
  });
  const isInitialStudentFilterRun = useRef(true);
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
    const divSet = new Set();
    CLASS_OPTIONS.forEach((className) => classSet.add(className));
    students.forEach((s) => {
      if (s.class_name) classSet.add(s.class_name);
      if (s.division) divSet.add(s.division.toString().trim());
    });
    setClassesList(Array.from(classSet).sort());
    setDivisionsList(Array.from(divSet).sort());

    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
      if (divisionRef.current && !divisionRef.current.contains(e.target)) {
        setShowDivisionDropdown(false);
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
        if (selectedDivision && selectedDivision !== "all") params.division = selectedDivision;
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
  }, [activeTab, debouncedStudentSearch, selectedClass, selectedDivision, studentPage, studentLimit]);

  useEffect(() => {
    if (isInitialStudentFilterRun.current) {
      isInitialStudentFilterRun.current = false;
      return;
    }
    setStudentPage(1);
  }, [debouncedStudentSearch, selectedClass]);

  useEffect(() => {
    if (!studentsLoading && students.length > 0) {
      const savedScroll = sessionStorage.getItem("hm_scroll_pos");
      if (savedScroll !== null) {
        const y = parseInt(savedScroll, 10);
        setTimeout(() => {
          window.scrollTo(0, y);
          sessionStorage.removeItem("hm_scroll_pos");
        }, 100);
      }
    }
  }, [studentsLoading, students]);

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
  const handleStudentClick = (studentId) => {
    sessionStorage.setItem("hm_scroll_pos", String(window.scrollY));
    sessionStorage.setItem("hm_studentPage", String(studentPage));
    sessionStorage.setItem("hm_studentSearch", studentSearch);
    sessionStorage.setItem("hm_selectedClass", selectedClass);
    navigate(`/student/${studentId}`);
  };
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

  const renderMobilePaginationControls = ({ page, totalPages, totalItems, setPage, itemLabel, className = "", hidden = false }) => {
    if (hidden) return null;
    return (
      <div className={`flex flex-col items-center gap-2 mt-4 mb-2 ${className}`}>
        <div className="flex items-center bg-white border border-gray-100 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-fit mx-auto overflow-hidden text-[14px]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`flex items-center gap-1 px-5 py-2.5 font-medium transition-colors ${page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-50 hover:text-[#E38B52]'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Prev
          </button>
          <div className="w-[1px] h-4 bg-gray-200"></div>
          <div className="px-5 py-2.5 font-bold text-[#170F49] flex gap-1">
            {page} <span className="text-gray-400 font-medium">/</span> {totalPages}
          </div>
          <div className="w-[1px] h-4 bg-gray-200"></div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages || p + 1, p + 1))}
            disabled={page >= totalPages}
            className={`flex items-center gap-1 px-5 py-2.5 font-medium transition-colors ${page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-50 hover:text-[#E38B52]'}`}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="text-[13px] text-gray-400 font-medium">
          {totalItems} {itemLabel} in total
        </div>
      </div>
    );
  };

  const renderMobileStudentPaginationControls = (className = "") =>
    renderMobilePaginationControls({
      page: studentPage,
      totalPages: studentTotalPages,
      totalItems: studentTotal,
      setPage: setStudentPage,
      itemLabel: "students",
      className,
      hidden: studentsLoading || students.length === 0,
    });

  return (
    <>
      {/* ================= DESKTOP & TABLET LAYOUT (>=768px) ================= */}
      <div className="hidden md:contents">
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

      <div className="fixed top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0 pointer-events-none" />
      <div className="fixed -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0 pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0 pointer-events-none" />

      <div className="relative w-[90%] max-w-[1200px] mx-4 z-10">
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 px-4">
                <div ref={studentSearchContainerRef} id="search-container" className="relative w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full md:w-[443px] pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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

                  {/* Single Unified Filter Button */}
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterDropdown((s) => !s)}
                      className="px-4 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                      aria-haspopup="listbox"
                      aria-expanded={showFilterDropdown}
                      aria-label="Filter students by class and division"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">
                        {selectedClass === "all" && selectedDivision === "all"
                          ? "Filter"
                          : selectedClass !== "all" && selectedDivision !== "all"
                            ? `${selectedClass} (Div ${selectedDivision})`
                            : selectedClass !== "all"
                              ? selectedClass
                              : `Div ${selectedDivision}`}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {showFilterDropdown && (
                      <div
                        className="absolute right-0 mt-2 w-64 bg-[#FAF9F6] rounded-2xl shadow-xl border border-[#E38B52]/20 p-4 z-50 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {/* Class Selection */}
                        <div>
                          <label className="block text-xs font-bold text-[#170F49] uppercase tracking-wider mb-1.5">
                            Class
                          </label>
                          <select
                            value={selectedClass}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedClass(val);
                              sessionStorage.setItem("hm_selectedClass", val);
                            }}
                            className="w-full px-3 py-2 text-sm text-[#170F49] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E38B52] shadow-sm"
                          >
                            <option value="all">All Classes</option>
                            {(classesList.length > 0 ? classesList : CLASS_OPTIONS).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Division Selection */}
                        <div>
                          <label className="block text-xs font-bold text-[#170F49] uppercase tracking-wider mb-1.5">
                            Division
                          </label>
                          <select
                            value={selectedDivision}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedDivision(val);
                              sessionStorage.setItem("hm_selectedDivision", val);
                            }}
                            className="w-full px-3 py-2 text-sm text-[#170F49] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E38B52] shadow-sm"
                          >
                            <option value="all">All Divisions</option>
                            {divisionsList.map((divOpt) => (
                              <option key={divOpt} value={divOpt}>
                                Division {divOpt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Reset Filters Option */}
                        {(selectedClass !== "all" || selectedDivision !== "all") && (
                          <div className="pt-2 border-t border-gray-200/60">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClass("all");
                                setSelectedDivision("all");
                                sessionStorage.setItem("hm_selectedClass", "all");
                                sessionStorage.setItem("hm_selectedDivision", "all");
                                setShowFilterDropdown(false);
                              }}
                              className="w-full py-1.5 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors text-center"
                            >
                              Reset Filters
                            </button>
                          </div>
                        )}
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
                          <img src={teacher.photo_url || teacher.photoUrl || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || "Teacher")}&size=250`} alt="Teacher" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#170F49]">{teacher.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-[#6F6C8F]"><span className="font-medium">Mobile:</span> {teacher.mobile_number}</p>
                            <p className="text-sm text-[#6F6C8F] line-clamp-2 break-words"><span className="font-medium">Qualifications:</span> {teacher.qualifications_details}</p>
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
                      className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.08)] sm:shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer mb-2 sm:mb-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[#170F49]">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden mt-0.5 sm:mt-0">
                            <img src={therapist.photo_url || therapist.photoUrl || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(therapist.name || "Therapist")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start w-full">
                              <h3 className="text-[17px] sm:text-lg font-semibold text-[#170F49] truncate pr-2">{therapist.name}</h3>
                              {/* Mobile Chevron indicator */}
                              <span className="sm:hidden text-slate-300 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                            
                            {/* Desktop Info (Hidden on mobile) */}
                            <div className="hidden sm:block space-y-1 mt-1">
                              <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Mobile:</span> {therapist.mobile_number || "Not provided"}</p>
                              {therapist.specialization && <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Specialization:</span> {therapist.specialization}</p>}
                              {therapist.qualifications_details && <p className="text-sm text-[#6F6C8F] line-clamp-2 break-words"><span className="font-medium">Qualifications:</span> {therapist.qualifications_details}</p>}
                            </div>
                            
                            {/* Mobile Info (Compact layout) */}
                            <div className="sm:hidden space-y-1 mt-1.5">
                              {therapist.specialization && <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">🩺</span> {therapist.specialization}</p>}
                              <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">📞</span> {therapist.mobile_number || "Not provided"}</p>
                              {therapist.qualifications_details && <p className="text-[13px] text-slate-500 flex items-start gap-1.5"><span className="text-sm mt-0.5 flex-shrink-0">🎓</span> <span className="line-clamp-2 break-words">{therapist.qualifications_details}</span></p>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 sm:space-x-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 items-center">
                          {/* Desktop Chevron */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTherapistClick(therapist.id); }}
                            className="hidden sm:block text-[#E38B52] hover:text-[#E38B52]/90 transition-colors p-2 rounded-lg hover:bg-[#E38B52]/10"
                            title="View Therapist Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={(event) => { event.stopPropagation(); handleAssignStudentsClick(therapist, event); }}
                              className="px-4 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#E38B52] text-[13px] sm:text-sm font-semibold text-[#E38B52] bg-white hover:bg-[#E38B52] hover:text-white transition-colors"
                              title="Assign Students"
                            >
                              Assign Students
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTherapist(therapist.id, therapist.name); }}
                            className="text-red-500 hover:text-red-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(227,139,82,0.2)]"
                            title="Delete Therapist"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      </div>

      
  {/* ================= MOBILE LAYOUT (<768px) ================= */}
      <div className="contents md:hidden">
        <div className="min-h-screen w-full flex bg-[#f7f7f7] relative overflow-x-hidden">
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white shadow-2xl z-50">
        <div className="p-6 text-center border-b border-gray-100 mt-4">
           <h1 className="text-2xl font-bold text-[#170F49] font-baskervville">Therapinc</h1>
           <p className="text-xs text-[#6F6C8F] mt-1">Headmistress Portal</p>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-3">
           <button onClick={() => { setActiveTab("students"); localStorage.setItem("headmistressActiveTab", "students"); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'students' ? 'bg-[#E38B52] text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             Students
           </button>
           <button onClick={() => { setActiveTab("teachers"); localStorage.setItem("headmistressActiveTab", "teachers"); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'teachers' ? 'bg-[#E38B52] text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             Teachers
           </button>
           <button onClick={() => { setActiveTab("therapists"); localStorage.setItem("headmistressActiveTab", "therapists"); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'therapists' ? 'bg-[#E38B52] text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
             Therapists
           </button>
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-3 mb-4">
           <button onClick={handleAddUserClick} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f0f0f0] text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
              Add User
           </button>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
              Logout
           </button>
        </div>
      </aside>

      {/* ----------------- MOBILE BOTTOM NAV ----------------- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-[60] px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button onClick={() => { setActiveTab("students"); localStorage.setItem("headmistressActiveTab", "students"); }} className={`flex flex-col items-center justify-center w-full h-full transition ${activeTab==='students'?'text-[#E38B52] scale-110':'text-gray-400 scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[10px] mt-1 font-medium">Students</span>
         </button>
         <button onClick={() => { setActiveTab("teachers"); localStorage.setItem("headmistressActiveTab", "teachers"); }} className={`flex flex-col items-center justify-center w-full h-full transition ${activeTab==='teachers'?'text-[#E38B52] scale-110':'text-gray-400 scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="text-[10px] mt-1 font-medium">Teachers</span>
         </button>
         <button onClick={() => { setActiveTab("therapists"); localStorage.setItem("headmistressActiveTab", "therapists"); }} className={`flex flex-col items-center justify-center w-full h-full transition ${activeTab==='therapists'?'text-[#E38B52] scale-110':'text-gray-400 scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="text-[10px] mt-1 font-medium">Therapists</span>
         </button>
         
         {/* Mobile Extra Menu (Add/Logout) */}
         <div className="relative flex flex-col items-center justify-center w-full h-full group">
            <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 transition hover:text-gray-600">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               <span className="text-[10px] mt-1 font-medium">Menu</span>
            </button>
            <div className="absolute bottom-16 right-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 hidden group-hover:flex group-focus-within:flex flex-col overflow-hidden mb-2">
               <button onClick={handleAddUserClick} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition text-sm font-medium text-gray-700 border-b border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                  Add User
               </button>
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition text-sm font-medium text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                  Logout
               </button>
            </div>
         </div>
      </div>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <main className="flex-1 w-full lg:ml-64 flex flex-col pb-20 lg:pb-0 min-h-screen">
          {/* Mobile Header Title */}
          <div className="lg:hidden w-full p-4 text-center bg-white shadow-sm z-40 sticky top-0">
              <h1 className="text-xl font-bold text-[#170F49] font-baskervville">Headmistress Portal</h1>
          </div>

          <div className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 z-10">
             <div className="relative bg-white/30 backdrop-blur-xl rounded-[24px] shadow-xl p-4 sm:p-6 border border-white/20 min-h-[70vh]">

          {activeTab === "students" ? (
            <>
              <div className="flex flex-col gap-4 mb-6">
                <div ref={studentSearchContainerRef} id="search-container" className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={handleAddStudent}
                    className="flex-1 h-[48px] justify-center px-2 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Student
                  </button>

                  <div className="relative flex-1" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterDropdown((s) => !s)}
                      className="w-full h-[48px] justify-center px-4 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center gap-2"
                      aria-haspopup="listbox"
                      aria-expanded={showFilterDropdown}
                      aria-label="Filter students by class and division"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium truncate max-w-[120px]">
                        {selectedClass === "all" && selectedDivision === "all"
                          ? "Filter"
                          : selectedClass !== "all" && selectedDivision !== "all"
                            ? `${selectedClass} (${selectedDivision})`
                            : selectedClass !== "all"
                              ? selectedClass
                              : `Div ${selectedDivision}`}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 shrink-0 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {showFilterDropdown && (
                      <div
                        className="absolute right-0 mt-2 w-60 bg-[#FAF9F6] rounded-2xl shadow-xl border border-[#E38B52]/20 p-4 z-50 space-y-3"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {/* Class Selection */}
                        <div>
                          <label className="block text-xs font-bold text-[#170F49] uppercase tracking-wider mb-1">
                            Class
                          </label>
                          <select
                            value={selectedClass}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedClass(val);
                              sessionStorage.setItem("hm_selectedClass", val);
                            }}
                            className="w-full px-3 py-2 text-sm text-[#170F49] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E38B52] shadow-sm"
                          >
                            <option value="all">All Classes</option>
                            {(classesList.length > 0 ? classesList : CLASS_OPTIONS).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Division Selection */}
                        <div>
                          <label className="block text-xs font-bold text-[#170F49] uppercase tracking-wider mb-1">
                            Division
                          </label>
                          <select
                            value={selectedDivision}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedDivision(val);
                              sessionStorage.setItem("hm_selectedDivision", val);
                            }}
                            className="w-full px-3 py-2 text-sm text-[#170F49] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E38B52] shadow-sm"
                          >
                            <option value="all">All Divisions</option>
                            {divisionsList.map((divOpt) => (
                              <option key={divOpt} value={divOpt}>
                                Division {divOpt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Reset Filters Option */}
                        {(selectedClass !== "all" || selectedDivision !== "all") && (
                          <div className="pt-2 border-t border-gray-200/60">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClass("all");
                                setSelectedDivision("all");
                                sessionStorage.setItem("hm_selectedClass", "all");
                                sessionStorage.setItem("hm_selectedDivision", "all");
                                setShowFilterDropdown(false);
                              }}
                              className="w-full py-1.5 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors text-center"
                            >
                              Reset Filters
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {renderMobileStudentPaginationControls("mb-8")}

              <div className="grid grid-cols-1 gap-3 px-0 sm:px-2">
                {studentsLoading && <div className="text-center text-[#6F6C8F]">Loading students...</div>}
                {!studentsLoading && students.length === 0 && <div className="text-center text-[#6F6C8F]">No students found.</div>}
                {!studentsLoading &&
                  students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentClick(student.id)}
                      className="bg-white rounded-2xl py-2.5 px-3 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-md transition-all duration-300 cursor-pointer mb-1.5"
                    >
                      <div className="flex items-center gap-4 text-[#170F49]">
                        <div className="w-[50px] h-[50px] rounded-lg overflow-hidden shrink-0">
                          <img
                            src={student.photo_url || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(student.name || "S")}&size=250&background=EFEFEF&color=170F49`}
                            alt={student.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://placehold.co/64x64/EFEFEF/AAAAAA?text=Photo"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate">{student.name}</h3>
                          <div className="mt-0.5 text-[13.5px] text-[#6F6C8F]/80 truncate tracking-tight">
                            <span className="font-medium text-[#170F49]">{student.class_name || "N/A"}</span>
                            <span className="mx-1.5 text-gray-200 text-lg leading-none align-middle">&bull;</span>
                            <span className="font-medium text-[#170F49]">Div {student.division || "-"}</span>
                            {student.roll_no && (
                              <>
                                <span className="mx-1.5 text-gray-200 text-lg leading-none align-middle">&bull;</span>
                                <span className="font-medium text-[#170F49]">Roll: {student.roll_no}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-2 self-center">
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
              <div className="flex flex-col gap-4 mb-6">
                <div id="search-container" className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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
                  className="flex-1 h-[48px] justify-center px-2 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Teacher
                </button>
              </div>

              {renderMobilePaginationControls({
                page: teacherPage,
                totalPages: teacherTotalPages,
                totalItems: teacherTotal,
                setPage: setTeacherPage,
                itemLabel: "teachers",
                className: "mb-8",
                hidden: teachersLoading || teachers.length === 0,
              })}

              <div className="grid grid-cols-1 gap-3 px-0 sm:px-2">
                {teachersLoading ? (
                  <div className="text-center text-[#6F6C8F]">Loading teachers...</div>
                ) : teachers.length === 0 ? (
                  <div className="text-center text-[#6F6C8F]">No teachers found.</div>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      onClick={() => handleTeacherClick(teacher.id)}
                      className="bg-white rounded-2xl py-2.5 px-3 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-md transition-all duration-300 cursor-pointer mb-1.5"
                    >
                      <div className="flex items-center gap-4 text-[#170F49]">
                        <div className="w-[50px] h-[50px] rounded-lg overflow-hidden shrink-0">
                          <img src={teacher.photo_url || teacher.photoUrl || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || "Teacher")}&size=250`} alt="Teacher" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate">{teacher.name}</h3>
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
              <div className="flex flex-col gap-4 mb-6">
                <div id="search-container" className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search therapists..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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
                  className="flex-1 h-[48px] justify-center px-2 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Therapist
                </button>
              </div>

              {renderMobilePaginationControls({
                page: therapistPage,
                totalPages: therapistTotalPages,
                totalItems: therapistTotal,
                setPage: setTherapistPage,
                itemLabel: "therapists",
                className: "mb-8",
                hidden: therapistsLoading || therapists.length === 0,
              })}

              <div className="grid grid-cols-1 gap-3 px-0 sm:px-2">
                {therapistsLoading ? (
                  <div className="text-center text-[#6F6C8F]">Loading therapists...</div>
                ) : therapists.length === 0 ? (
                  <div className="text-center text-[#6F6C8F]">No therapists found.</div>
                ) : (
                  therapists.map((therapist) => (
                                        <div
                      key={therapist.id}
                      onClick={() => handleTherapistClick(therapist.id)}
                      className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.08)] sm:shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer mb-2 sm:mb-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[#170F49]">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden mt-0.5 sm:mt-0">
                            <img src={therapist.photo_url || therapist.photoUrl || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(therapist.name || "Therapist")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start w-full">
                              <h3 className="text-[17px] sm:text-lg font-semibold text-[#170F49] truncate pr-2">{therapist.name}</h3>
                              {/* Mobile Chevron indicator */}
                              <span className="sm:hidden text-slate-300 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                            
                            {/* Desktop Info (Hidden on mobile) */}
                            <div className="hidden sm:block space-y-1 mt-1">
                              <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Mobile:</span> {therapist.mobile_number || "Not provided"}</p>
                              {therapist.specialization && <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Specialization:</span> {therapist.specialization}</p>}
                              {therapist.qualifications_details && <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Qualifications:</span> {therapist.qualifications_details}</p>}
                            </div>
                            
                            {/* Mobile Info (Compact layout) */}
                            <div className="sm:hidden space-y-1 mt-1.5">
                              {therapist.specialization && <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">🩺</span> {therapist.specialization}</p>}
                              <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">📞</span> {therapist.mobile_number || "Not provided"}</p>
                              {therapist.qualifications_details && <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">🎓</span> {therapist.qualifications_details}</p>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 sm:space-x-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 items-center">
                          {/* Desktop Chevron */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTherapistClick(therapist.id); }}
                            className="hidden sm:block text-[#E38B52] hover:text-[#E38B52]/90 transition-colors p-2 rounded-lg hover:bg-[#E38B52]/10"
                            title="View Therapist Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={(event) => { event.stopPropagation(); handleAssignStudentsClick(therapist, event); }}
                              className="px-4 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#E38B52] text-[13px] sm:text-sm font-semibold text-[#E38B52] bg-white hover:bg-[#E38B52] hover:text-white transition-colors"
                              title="Assign Students"
                            >
                              Assign Students
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTherapist(therapist.id, therapist.name); }}
                            className="text-red-500 hover:text-red-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(227,139,82,0.2)]"
                            title="Delete Therapist"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="flex items-center gap-3 w-full">
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
      </main>
    </div>

      </div>
    </>
  );
};

export default HeadMaster;