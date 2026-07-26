import React, { useState, useEffect, useRef } from "react";
import { formatAadhaar } from "../utils/validation";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const TeacherPage = () => {
  // Get the teacher ID from URL parameters
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/teachers/${id}`,
        );

        // Map API response to the format expected by the UI
        const classAssignments = response.data.class_assignments || [];
        const formattedClasses = classAssignments.map((assignment) => ({
          class: assignment.class || "Not specified",
          year: assignment.year || new Date().getFullYear().toString(),
        }));

        setTeacher({
          name: response.data.name,
          teacherId: response.data.id,
          // keep both raw ISO values (for editing) and formatted strings (for display)
          date_of_birth_raw: response.data.date_of_birth,
          dob: response.data.date_of_birth
            ? new Date(response.data.date_of_birth).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )
            : "",
          gender: response.data.gender,
          religion: response.data.religion,
          caste: response.data.caste,
          mobile: response.data.mobile_number,
          email: response.data.email || "Not provided",
          address: response.data.address,
          aadhar_raw: response.data.aadhar_number,
          aadhar: formatAadhaar(response.data.aadhar_number),
          bloodGroup: response.data.blood_group,
          category: response.data.category,
          rciNumber: response.data.rci_number,
          rci_renewal_date_raw: response.data.rci_renewal_date,
          rciRenewalDate: response.data.rci_renewal_date
            ? new Date(response.data.rci_renewal_date).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )
            : "",
          qualifications: response.data.qualifications_details,
          // prefer stored photo_url, otherwise ui-avatars fallback
          photoUrl:
            response.data.photo_url ||
            `https://eu.ui-avatars.com/api/?name=${(response.data.name || "").replace(" ", "+")}&size=250`,
          classes: formattedClasses,
          // if class_assignments include division info, normalize for display and editing
          classAssignmentsRaw: response.data.class_assignments || [],
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teacher:", error);
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  // File selection handler
  const handlePhotoSelect = (e) => {
    setPhotoError(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Only PNG and JPG images are allowed.");
      return;
    }
    // optional size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("File too large. Max 5MB allowed.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Upload handler - adjust endpoint if backend expects different path/field
  const uploadPhoto = async () => {
    if (!photoFile) {
      setPhotoError("No file selected.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("file", photoFile);

      // Do NOT set Content-Type explicitly. Let the browser set the multipart boundary.
      const headers = {};
      // If your backend requires auth, set the Authorization header (example uses localStorage)
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const resp = await axios.post(
        `${API_BASE_URL}/api/v1/teachers/${id}/photo`,
        formData,
        {
          headers,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(pct);
            }
          },
          validateStatus: (status) => status < 500, // let 4xx pass so we can handle them
        },
      );

      if (resp.status >= 400) {
        // show server-provided message if any
        const serverMsg =
          resp.data &&
          (resp.data.detail || resp.data.message || JSON.stringify(resp.data));
        throw new Error(
          serverMsg || `Upload failed with status ${resp.status}`,
        );
      }

      // backend should return updated photo URL
      const newUrl = resp.data.photo_url || resp.data.url || resp.data.photoUrl;
      setTeacher((prev) => ({ ...prev, photoUrl: newUrl || prev.photoUrl }));
      setPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setUploadProgress(0);
      showToast("Photo uploaded successfully.");
    } catch (err) {
      console.error("Photo upload failed", err, err.response?.data || "");
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message) ||
        "Upload failed. Please try again.";
      setPhotoError(errorMessage);
      showToast(`Failed to upload photo: ${errorMessage}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (photoPreview) {
      try {
        URL.revokeObjectURL(photoPreview);
      } catch (err) { }
      setPhotoPreview(null);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    if (!teacher?.photoUrl && !teacher?.photo_url) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this teacher's photo?")) {
      return;
    }

    try {
      const headers = {};
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await axios.delete(`${API_BASE_URL}/api/v1/teachers/${id}/photo`, { headers });

      setTeacher((prev) => ({ ...(prev || {}), photoUrl: null }));
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadProgress(0);
      showToast("Photo deleted successfully.");
    } catch (err) {
      console.error("Photo delete failed", err, err.response?.data || "");
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message) ||
        "Delete failed. Please try again.";
      setPhotoError(errorMessage);
      showToast(`Failed to delete photo: ${errorMessage}`, "error");
    }
  };

  const cancelPhotoSelection = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    setUploadProgress(0);
  };

  // Function to handle edit mode toggle
  const handleEditToggle = () => {
    if (!isEditing) {
      // Enter edit mode - populate form with current data
      setEditFormData({
        name: teacher.name,
        mobile_number: teacher.mobile,
        email: teacher.email,
        address: teacher.address,
        qualifications_details: teacher.qualifications,
        rci_number: teacher.rciNumber,
        // populate edit fields with RAW ISO values so date inputs work correctly
        rci_renewal_date:
          teacher.rci_renewal_date_raw || teacher.rciRenewalDate,
        blood_group: teacher.bloodGroup,
        category: teacher.category,
        // populate Aadhaar with formatted string for editing, but we'll clean before sending
        aadhar_number: teacher.aadhar_raw
          ? formatAadhaar(teacher.aadhar_raw)
          : teacher.aadhar,
        religion: teacher.religion,
        caste: teacher.caste,
        gender: teacher.gender,
        date_of_birth: teacher.date_of_birth_raw || teacher.dob,
          // preload class assignment edits if available; always provide
          // one empty editable row so fields are editable in edit mode
          class_assignments:
            teacher.classAssignmentsRaw && teacher.classAssignmentsRaw.length
              ? teacher.classAssignmentsRaw
              : [
                  {
                    class: "",
                    division: "",
                    year: new Date().getFullYear().toString(),
                  },
                ],
      });
    }
    setIsEditing(!isEditing);
  };

  // Function to save edited data
  const handleSaveEdit = async () => {
    try {
      // Clean class assignments: sanitize empty class/division/year fields, and filter out completely empty ones
      const cleanedClassAssignments = editFormData.class_assignments
        ? editFormData.class_assignments
            .map((assignment) => {
              const cleaned = { ...assignment };
              if (cleaned.class === "") cleaned.class = null;
              if (cleaned.division === "") cleaned.division = null;
              if (cleaned.year === "") cleaned.year = null;
              return cleaned;
            })
            .filter((assignment) => assignment.class !== null || assignment.division !== null)
        : undefined;

      // Clean Aadhaar (remove spaces) and ensure payload dates are ISO (or null if empty)
      const payload = {
        ...editFormData,
        aadhar_number: editFormData.aadhar_number
          ? String(editFormData.aadhar_number).replace(/\s+/g, "")
          : undefined,
        date_of_birth: editFormData.date_of_birth || null,
        rci_renewal_date: editFormData.rci_renewal_date || null,
        class_assignments: cleanedClassAssignments,
      };

      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/teachers/${id}`,
        payload,
        config
      );

      if (response.status === 200) {
        // Update the local teacher state with new data
        // Update local teacher state for display, keep formatted strings
        setTeacher((prev) => ({
          ...prev,
          name: editFormData.name,
          mobile: editFormData.mobile_number,
          email: editFormData.email,
          address: editFormData.address,
          qualifications: editFormData.qualifications_details,
          rciNumber: editFormData.rci_number,
          rci_renewal_date_raw: editFormData.rci_renewal_date,
          rciRenewalDate: editFormData.rci_renewal_date
            ? new Date(editFormData.rci_renewal_date).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long", day: "numeric" },
              )
            : "",
          bloodGroup: editFormData.blood_group,
          category: editFormData.category,
          aadhar_raw: editFormData.aadhar_number
            ? String(editFormData.aadhar_number).replace(/\s+/g, "")
            : undefined,
          aadhar: editFormData.aadhar_number
            ? formatAadhaar(editFormData.aadhar_number)
            : prev.aadhar,
          religion: editFormData.religion,
          caste: editFormData.caste,
          gender: editFormData.gender,
          date_of_birth_raw: editFormData.date_of_birth,
          dob: editFormData.date_of_birth
            ? new Date(editFormData.date_of_birth).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : prev.dob,
        }));

        setIsEditing(false);
        showToast("Teacher details updated successfully!");
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      showToast("Failed to update teacher details. Please try again.", "error");
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  // Helpers to manage class_assignments while editing
  // 'Add Assignment' functionality removed per UX request

  const updateAssignmentField = (index, field, value) => {
    const arr = (editFormData.class_assignments || []).slice();
    if (!arr[index]) return;
    arr[index][field] = value;
    // if class cleared, clear division
    if (field === "class" && !value) arr[index].division = "";
    setEditFormData({ ...editFormData, class_assignments: arr });
  };

  const getTeacherData = (teacherId) => {
    // Mock data for different teachers
    const teachers = {
      "arjun-jayakumar": {
        name: "Arjun Jayakumar",
        teacherId: "TCH2024001",
        dob: "15 January 1985",
        gender: "Male",
        religion: "Hinduism",
        caste: "General",
        mobile: "+91 9876543210",
        email: "arjun.jayakumar@school.edu",
        address:
          "123 Teacher Colony, Education Street, Knowledge City - 560001",
        aadhar: "XXXX-XXXX-1234",
        bloodGroup: "O+",
        category: "General",
        rciNumber: "RCI12345678",
        rciRenewalDate: "10 January 2025",
        qualifications:
          "Bachelor of Education (B.Ed) in Special Education from Kerala University. Masters in AI/ML from IIT.",
        subject: "AI/ML",
        classAssigned: "X-B",
        classes: [
          {
            class: "Class 10-B",
            subject: "AI/ML",
            days: "Monday, Wednesday, Friday",
            timing: "10:00 AM - 11:00 AM",
          },
          {
            class: "Class 9-A",
            subject: "Computer Science",
            days: "Tuesday, Thursday",
            timing: "11:15 AM - 12:15 PM",
          },
        ],
      },
      "aditya-s-nair": {
        name: "Aditya S Nair",
        teacherId: "TCH2024002",
        dob: "22 March 1990",
        gender: "Male",
        religion: "Hinduism",
        caste: "General",
        mobile: "+91 9876543211",
        email: "aditya.s.nair@school.edu",
        address: "456 Knowledge Park, Wisdom Lane, Intellect City - 560002",
        aadhar: "XXXX-XXXX-5678",
        bloodGroup: "A+",
        category: "General",
        rciNumber: "RCI87654321",
        rciRenewalDate: "15 February 2025",
        qualifications:
          "Bachelor of Education (B.Ed) from Mumbai University. Masters in Mathematics from IISc Bangalore.",
        subject: "Mathematics",
        classAssigned: "X-A",
        classes: [
          {
            class: "Class 10-A",
            subject: "Mathematics",
            days: "Monday, Wednesday, Friday",
            timing: "9:00 AM - 10:00 AM",
          },
          {
            class: "Class 8-B",
            subject: "Mathematics",
            days: "Tuesday, Thursday",
            timing: "10:15 AM - 11:15 AM",
          },
        ],
      },
      "abhiram-krishna": {
        name: "Abhiram Krishna",
        teacherId: "TCH2024003",
        dob: "10 October 1988",
        gender: "Male",
        religion: "Hinduism",
        caste: "General",
        mobile: "+91 9876543212",
        email: "abhiram.krishna@school.edu",
        address: "789 Educator Homes, Learning Road, Academic City - 560003",
        aadhar: "XXXX-XXXX-9012",
        bloodGroup: "B+",
        category: "General",
        rciNumber: "RCI24681357",
        rciRenewalDate: "20 March 2025",
        qualifications:
          "Bachelor of Special Education from Delhi University. Masters in History from JNU.",
        subject: "Not Mathematics",
        classAssigned: "X-A",
        classes: [
          {
            class: "Class 10-A",
            subject: "History",
            days: "Monday, Wednesday",
            timing: "11:00 AM - 12:00 PM",
          },
          {
            class: "Class 9-B",
            subject: "Social Studies",
            days: "Tuesday, Thursday, Friday",
            timing: "1:15 PM - 2:15 PM",
          },
        ],
      },
      "faheem-mohammed": {
        name: "Faheem Mohammed",
        teacherId: "TCH2024004",
        dob: "5 May 1992",
        gender: "Male",
        religion: "Islam",
        caste: "General",
        mobile: "+91 9876543213",
        email: "faheem.mohammed@school.edu",
        address:
          "101 Scholar Avenue, Teaching Street, Automotive City - 560004",
        aadhar: "XXXX-XXXX-3456",
        bloodGroup: "AB+",
        category: "General",
        rciNumber: "RCI13579246",
        rciRenewalDate: "25 April 2025",
        qualifications:
          "Bachelor of Education in Automotive Engineering. Masters in Mechanical Engineering from MIT.",
        subject: "Cars",
        classAssigned: "X-A",
        classes: [
          {
            class: "Class 10-A",
            subject: "Automotive Technology",
            days: "Monday, Wednesday, Friday",
            timing: "2:00 PM - 3:00 PM",
          },
          {
            class: "Class 11-B",
            subject: "Mechanical Design",
            days: "Tuesday, Thursday",
            timing: "9:15 AM - 10:15 AM",
          },
        ],
      },
    };

    return (
      teachers[teacherId] || {
        name: "Teacher Not Found",
        teacherId: "Unknown",
        dob: "Unknown",
        gender: "Unknown",
        religion: "Unknown",
        caste: "Unknown",
        mobile: "Unknown",
        email: "Unknown",
        address: "Unknown",
        aadhar: "Unknown",
        bloodGroup: "Unknown",
        category: "Unknown",
        rciNumber: "Unknown",
        rciRenewalDate: "Unknown",
        qualifications: "Unknown",
        subject: "Unknown",
        classAssigned: "Unknown",
        classes: [],
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen max-lg:min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">
          Loading teacher information...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-lg:min-h-[100dvh] w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-hidden py-20 max-lg:py-0 max-lg:pb-[calc(40px+env(safe-area-inset-bottom))] max-lg:pt-0 max-lg:overflow-x-hidden">

      {/* Mobile Sticky Header */}
      <div className="hidden max-lg:flex sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 items-center shadow-sm">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#6F6C90] hover:text-[#170F49] transition-colors bg-transparent p-0 m-0 border-none shadow-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-8 left-8 max-lg:hidden bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2 z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />

      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 max-md:mb-5 text-center font-baskervville">
          Teacher Information
        </h1>

        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 max-md:p-3 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-md:gap-4 md:gap-8 max-md:gap-4">
            {/* Basic Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                Personal Information
              </h2>
              <div className="flex flex-col md:flex-row gap-6 max-md:gap-4 p-4 md:p-6 bg-white/50 rounded-2xl">
                {/* Teacher Photo */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                    <img
                      src={
                        photoPreview ||
                        teacher?.photoUrl ||
                        teacher?.photo_url ||
                        "https://placehold.co/200x200/EFEFEF/AAAAAA?text=No+Photo"
                      }
                      alt="Teacher"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/png, image/jpeg"
                    style={{ display: "none" }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-white rounded-lg border border-[#E38B52]/30 hover:bg-[#E38B52] hover:border-[#E38B52] transition-all duration-200 shadow-md group"
                      title="Upload Photo"
                      type="button"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-white transition-colors duration-200">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </button>

                    {(teacher?.photoUrl || teacher?.photo_url || photoPreview) && (
                      <button
                        onClick={handlePhotoDelete}
                        className="p-2.5 bg-white rounded-lg border border-red-500/30 hover:bg-red-500 hover:border-red-500 transition-all duration-200 shadow-md group"
                        title="Delete Photo"
                        type="button"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-white transition-colors duration-200">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {photoFile && (
                    <button
                      onClick={uploadPhoto}
                      disabled={uploading}
                      className={`mt-2 px-4 py-2 text-white text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${uploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                      type="button"
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        "Upload Photo"
                      )}
                    </button>
                  )}

                  {photoError && (
                    <p className="text-sm text-red-500 text-center max-w-xs">{photoError}</p>
                  )}
                </div>

                {/* Teacher Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-md:gap-4 pl-8 md:pl-12">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Full Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.name || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {teacher.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Teacher ID</p>
                    <p className="text-[#170F49] font-medium">
                      #{teacher.teacherId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Date of Birth</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editFormData.date_of_birth || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            date_of_birth: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {teacher.dob}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Gender</p>
                    {isEditing ? (
                      <select
                        value={editFormData.gender || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            gender: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {teacher.gender}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Religion</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.religion || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            religion: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {teacher.religion}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Caste</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.caste || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            caste: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">
                        {teacher.caste}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4 p-6 bg-white/50 rounded-2xl">
                <div>
                  <p className="text-sm text-[#6F6C90]">Mobile Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editFormData.mobile_number || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          mobile_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">
                      {teacher.mobile}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">
                      {teacher.email}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-[#6F6C90]">Address</p>
                  {isEditing ? (
                    <textarea
                      value={editFormData.address || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          address: e.target.value,
                        })
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80 resize-none"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">
                      {teacher.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Identification Details Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                Identification Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4 p-6 bg-white/50 rounded-2xl">
                <div>
                  <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
                  <p className="text-[#170F49] font-medium">{teacher.aadhar}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Blood Group</p>
                  <p className="text-[#170F49] font-medium">
                    {teacher.bloodGroup}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Category</p>
                  <p className="text-[#170F49] font-medium">
                    {teacher.category}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                Professional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4 p-6 bg-white/50 rounded-2xl">
                <div>
                  <p className="text-sm text-[#6F6C90]">RCI Number</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.rci_number || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          rci_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">
                      {teacher.rciNumber}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">RCI Renewal Date</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editFormData.rci_renewal_date || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          rci_renewal_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">
                      {teacher.rciRenewalDate}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-[#6F6C90]">
                    Qualifications Details
                  </p>
                  {isEditing ? (
                    <textarea
                      value={editFormData.qualifications_details || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          qualifications_details: e.target.value,
                        })
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80 resize-none"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">
                      {teacher.qualifications}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Classes Assigned Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                Classes Assigned
              </h2>
              <div className="p-6 bg-white/50 rounded-2xl">
                {/* Add Assignment button removed per request */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse rounded-xl overflow-hidden">
                    <thead className="bg-[#E38B52]/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                          Division
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                          Year
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/70">
                      {isEditing
                        ? (editFormData.class_assignments || []).map(
                            (assignment, index) => (
                              <tr
                                key={index}
                                className={
                                  index <
                                  (editFormData.class_assignments || [])
                                    .length -
                                    1
                                    ? "border-b border-[#E38B52]/10"
                                    : ""
                                }
                              >
                                <td className="px-4 py-3 text-sm text-[#170F49]">
                                  <div className="flex gap-3 items-center">
                                    <div className="w-[60%]">
                                      <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={assignment.class || ""}
                                        onChange={(e) =>
                                          updateAssignmentField(
                                            index,
                                            "class",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select Class</option>
                                        <option value="PrePrimary">
                                          PrePrimary
                                        </option>
                                        <option value="Primary 1">
                                          Primary 1
                                        </option>
                                        <option value="Primary 2">
                                          Primary 2
                                        </option>
                                        <option value="Secondary">
                                          Secondary
                                        </option>
                                        <option value="Pre vocational 1">
                                          Pre vocational 1
                                        </option>
                                        <option value="Pre vocational 2">
                                          Pre vocational 2
                                        </option>
                                        <option value="Care group below 18 years">
                                          Care group below 18 years
                                        </option>
                                        <option value="Care group Above 18 years">
                                          Care group Above 18 years
                                        </option>
                                        <option value="Vocational 18-35 years">
                                          Vocational 18-35 years
                                        </option>
                                      </select>
                                    </div>
                                    <div className="w-[40%]">
                                      <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={assignment.division || ""}
                                        onChange={(e) =>
                                          updateAssignmentField(
                                            index,
                                            "division",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                      </select>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-[#170F49]">
                                  <div className="flex items-center gap-3">
                                    <select
                                      className="px-3 py-2 border rounded-lg"
                                      value={
                                        assignment.year ||
                                        new Date().getFullYear().toString()
                                      }
                                      onChange={(e) =>
                                        updateAssignmentField(
                                          index,
                                          "year",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option
                                        value={new Date()
                                          .getFullYear()
                                          .toString()}
                                      >
                                        {new Date().getFullYear()}
                                      </option>
                                      {[...Array(5)].map((_, i) => {
                                        const year =
                                          new Date().getFullYear() - i - 1;
                                        return (
                                          <option
                                            key={year}
                                            value={year.toString()}
                                          >
                                            {year}
                                          </option>
                                        );
                                      })}
                                      {[...Array(5)].map((_, i) => {
                                        const year =
                                          new Date().getFullYear() + i + 1;
                                        return (
                                          <option
                                            key={year}
                                            value={year.toString()}
                                          >
                                            {year}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    {/* Remove button hidden per request */}
                                  </div>
                                </td>
                              </tr>
                            ),
                          )
                        : teacher.classes.map((classItem, index) => (
                            <tr
                              key={index}
                              className={
                                index < teacher.classes.length - 1
                                  ? "border-b border-[#E38B52]/10"
                                  : ""
                              }
                            >
                              <td className="px-4 py-3 text-sm text-[#170F49]">
                                {classItem.class}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#170F49]">
                                {teacher.classAssignmentsRaw &&
                                teacher.classAssignmentsRaw[index] &&
                                teacher.classAssignmentsRaw[index].division
                                  ? teacher.classAssignmentsRaw[index].division
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#170F49]">
                                {classItem.year}
                              </td>
                            </tr>
                          ))}
                      {((isEditing &&
                        (!editFormData.class_assignments ||
                          editFormData.class_assignments.length === 0)) ||
                        (!isEditing && teacher.classes.length === 0)) && (
                        <tr>
                          <td
                            colSpan={isEditing ? "3" : "3"}
                            className="px-4 py-3 text-sm text-center text-[#6F6C90]"
                          >
                            No class assignments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">
                Documents
              </h2>
              <div className="p-6 bg-white/50 rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#E38B52"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#170F49]">
                          RCI Certificate
                        </p>
                        <p className="text-sm text-[#6F6C90]">
                          Uploaded on 10 Jan 2024
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#E38B52"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#170F49]">
                          Educational Certificates
                        </p>
                        <p className="text-sm text-[#6F6C90]">
                          Uploaded on 15 Dec 2023
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 md:mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-2xl hover:bg-gray-600 hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Details
                </button>
                <button className="flex-1 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200">
                  Download Profile
                </button>
              </>
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

        @keyframes float-particle {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(var(--tx), var(--ty)) scale(0.8);
          }
        }

        .particle-1,
        .particle-2,
        .particle-3 {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          --tx: 10px;
          --ty: -10px;
          animation: float-particle 3s infinite ease-in-out;
        }

        .particle-2 {
          top: 50%;
          right: 20%;
          --tx: -15px;
          --ty: 5px;
          animation: float-particle 4s infinite ease-in-out;
        }

        .particle-3 {
          bottom: 20%;
          left: 50%;
          --tx: 5px;
          --ty: 15px;
          animation: float-particle 5s infinite ease-in-out;
        }
      `}</style>

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
    </div>
  );
};

export default TeacherPage;
