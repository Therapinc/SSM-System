import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const TherapistStudentAssignmentModal = ({
  open,
  therapist,
  classOptions = [],
  teacherScope = false,
  onClose,
  onSaved,
}) => {
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    if (!open || !therapist?.id) {
      return;
    }

    setError("");
    setSearchTerm("");
    setSelectedClass("all");
    setSelectedDivision("all");
    setViewMode("all");
  }, [open, therapist?.id]);

  useEffect(() => {
    if (!open || !therapist?.id) {
      return;
    }

    let cancelled = false;

    const fetchAssignedStudents = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/therapists/${therapist.id}/students`,
        );

        if (cancelled) {
          return;
        }

        setSelectedStudentIds(new Set((response.data || []).map((student) => student.id)));
      } catch (requestError) {
        if (!cancelled) {
          console.error("Error loading therapist assignments:", requestError);
          setError("Unable to load existing assignments.");
        }
      }
    };

    fetchAssignedStudents();

    return () => {
      cancelled = true;
    };
  }, [open, therapist?.id]);

  useEffect(() => {
    if (!open || !therapist?.id) {
      return;
    }

    let cancelled = false;

    const fetchStudents = async () => {
      setLoading(true);
      setError("");

      try {
        let items = [];

        if (teacherScope) {
          const response = await axios.get(`${API_BASE_URL}/api/v1/teachers/me/students`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const teacherStudents = Array.isArray(response.data) ? response.data : [];
          const query = searchTerm.trim().toLowerCase();

          items = query
            ? teacherStudents.filter((student) => {
                const name = (student.name || "").toLowerCase();
                const studentId = (student.student_id || "").toLowerCase();
                const admission = (student.admission_number || "").toLowerCase();
                return (
                  name.includes(query) ||
                  studentId.includes(query) ||
                  admission.includes(query)
                );
              })
            : teacherStudents;
        } else {
          const params = new URLSearchParams();
          params.set("page", "1");
          params.set("page_size", "5000");
          if (searchTerm.trim()) {
            params.set("search", searchTerm.trim());
          }
          if (selectedClass !== "all") {
            params.set("class_name", selectedClass);
          }

          const response = await axios.get(
            `${API_BASE_URL}/api/v1/students/?${params.toString()}`,
          );

          items = Array.isArray(response.data?.items)
            ? response.data.items
            : Array.isArray(response.data)
              ? response.data
              : [];
        }

        if (cancelled) {
          return;
        }

        setStudents(
          items
            .slice()
            .sort((left, right) => (left.name || "").localeCompare(right.name || "")),
        );
      } catch (requestError) {
        if (!cancelled) {
          console.error("Error loading students:", requestError);
          setError("Unable to load students.");
          setStudents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      cancelled = true;
    };
  }, [open, therapist?.id, searchTerm, selectedClass, teacherScope]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const visibleStudentCount = useMemo(() => students.length, [students]);
  const divisionOptions = useMemo(() => {
    const divisions = new Set();
    students.forEach((student) => {
      if (student.division) {
        divisions.add(student.division);
      }
    });
    return Array.from(divisions).sort();
  }, [students]);
  const selectedStudents = useMemo(
    () => students.filter((student) => selectedStudentIds.has(student.id)),
    [students, selectedStudentIds],
  );
  const unselectedStudents = useMemo(
    () => students.filter((student) => !selectedStudentIds.has(student.id)),
    [students, selectedStudentIds],
  );
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesViewMode =
        viewMode === "all"
          ? true
          : viewMode === "selected"
            ? selectedStudentIds.has(student.id)
            : !selectedStudentIds.has(student.id);
      const matchesDivision =
        selectedDivision === "all" || (student.division || "") === selectedDivision;

      return matchesViewMode && matchesDivision;
    });
  }, [students, selectedStudentIds, selectedDivision, viewMode]);

  const selectAllVisible = () => {
    setSelectedStudentIds((previous) => {
      const next = new Set(previous);
      filteredStudents.forEach((student) => next.add(student.id));
      return next;
    });
  };

  const clearAllVisible = () => {
    setSelectedStudentIds((previous) => {
      const next = new Set(previous);
      filteredStudents.forEach((student) => next.delete(student.id));
      return next;
    });
  };

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((previous) => {
      const next = new Set(previous);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!therapist?.id) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/therapists/${therapist.id}/students`,
        { student_ids: Array.from(selectedStudentIds) },
      );

      onSaved?.(response.data || []);
      onClose();
    } catch (requestError) {
      console.error("Error saving therapist assignments:", requestError);
      setError(
        requestError?.response?.data?.detail ||
          "Unable to save assignments. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open || !therapist) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#fff6ef] to-[#fffaf6] px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8742F]">
                Admin action
              </p>
              <h2 className="mt-1 text-[1.35rem] font-bold leading-tight text-[#170F49]">
                Assign Students
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6F6C8F]">
                <span>
                  Update the checklist for <span className="font-semibold text-[#170F49]">{therapist.name}</span>
                </span>
                <span className="font-semibold text-[#170F49]">
                  {selectedStudentIds.size} assigned
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
              aria-label="Close assignment modal"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-4 overflow-hidden px-4 py-3 sm:px-5 lg:grid-cols-[280px_1fr] lg:gap-5">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 lg:sticky lg:top-3 lg:self-start">
            <div>
              <label className="block text-sm font-semibold text-[#170F49]">
                Search students
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, admission no, or student ID"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#170F49] outline-none transition focus:border-[#E38B52] focus:ring-4 focus:ring-[#E38B52]/15"
              />
            </div>

            {!teacherScope && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[#170F49]">
                    Filter by class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#170F49] outline-none transition focus:border-[#E38B52] focus:ring-4 focus:ring-[#E38B52]/15"
                  >
                    <option value="all">All classes</option>
                    {classOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#170F49]">
                    Filter by division
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(event) => setSelectedDivision(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#170F49] outline-none transition focus:border-[#E38B52] focus:ring-4 focus:ring-[#E38B52]/15"
                  >
                    <option value="all">All divisions</option>
                    {divisionOptions.map((division) => (
                      <option key={division} value={division}>
                        {division}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6F6C8F] shadow-sm">
              <div>
                Selected <span className="font-semibold text-[#170F49]">{selectedStudentIds.size}</span> students
              </div>
              <div className="mt-1">
                Showing <span className="font-semibold text-[#170F49]">{visibleStudentCount}</span> results
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#170F49]">
                Show
              </label>
              <div className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-[#170F49]">
                {[
                  { value: "all", label: "All Students" },
                  { value: "selected", label: "Selected Students" },
                  { value: "unselected", label: "Unselected Students" },
                ].map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="viewMode"
                      value={option.value}
                      checked={viewMode === option.value}
                      onChange={() => setViewMode(option.value)}
                      className="h-4 w-4 border-slate-300 text-[#E38B52] focus:ring-[#E38B52]"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllVisible}
                disabled={filteredStudents.length === 0}
                className="inline-flex items-center justify-center rounded-2xl border border-[#E38B52] bg-white px-4 py-2 text-sm font-semibold text-[#E38B52] transition hover:bg-[#E38B52] hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white disabled:hover:text-slate-400"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllVisible}
                disabled={filteredStudents.length === 0}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#170F49] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Clear All
              </button>
            </div>

            <p className="text-xs leading-5 text-[#6F6C8F]">
              Assignments can be updated anytime. Changes only affect this therapist-to-student link.
            </p>
          </div>

          <div className="flex min-h-[460px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-sm text-[#6F6C8F]">
                Use the checklist to assign or unassign multiple students at once.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center text-[#6F6C8F]">
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center text-[#6F6C8F]">
                  No students match the current filters.
                </div>
              ) : (
                <div className="space-y-5">
                  {selectedStudents.length > 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold text-emerald-900">
                          Selected Students ({selectedStudents.length})
                        </h3>
                        <button
                          type="button"
                          onClick={clearAllVisible}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                        >
                          Clear selected on screen
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => toggleStudent(student.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-sm text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                          >
                            <span className="text-emerald-600">☑</span>
                            <span className="font-medium">{student.name}</span>
                            <span className="text-xs text-emerald-700">{student.student_id || ""}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {unselectedStudents.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                          <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <tr>
                              <th className="w-14 px-3 py-2.5">Sel</th>
                              <th className="px-3 py-2.5">Student</th>
                              <th className="px-3 py-2.5">ID</th>
                              <th className="px-3 py-2.5">Class</th>
                              <th className="px-3 py-2.5">Division</th>
                              <th className="px-3 py-2.5">Roll No</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredStudents.map((student) => {
                              const isSelected = selectedStudentIds.has(student.id);

                              return (
                                <tr
                                  key={student.id}
                                  className={isSelected ? "bg-[#E38B52]/10" : "hover:bg-slate-50"}
                                >
                                  <td className="px-3 py-2 align-middle">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleStudent(student.id)}
                                      className="h-4 w-4 rounded border-slate-300 text-[#E38B52] focus:ring-[#E38B52]"
                                    />
                                  </td>
                                  <td className="px-3 py-2 align-middle font-medium text-[#170F49]">
                                    {student.name}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-[#6F6C8F]">
                                    {student.student_id || "-"}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-[#6F6C8F]">
                                    {student.class_name || "-"}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-[#6F6C8F]">
                                    {student.division || "-"}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-[#6F6C8F]">
                                    {student.roll_no || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {filteredStudents.length > 0 && filteredStudents.every((student) => selectedStudentIds.has(student.id)) && (
                    <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-[#6F6C8F]">
                      Every loaded student is currently selected.
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600 sm:px-5">
                {error}
              </div>
            )}

            <div className="sticky bottom-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#170F49] transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                    saving
                      ? "cursor-not-allowed bg-[#E38B52]/60"
                      : "bg-[#E38B52] hover:bg-[#C8742F]"
                  }`}
                >
                  {saving ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistStudentAssignmentModal;