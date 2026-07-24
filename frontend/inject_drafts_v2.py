import re
import os

filepath = 'src/pages/StudentPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Global Effects (Inject after toast state)
draft_effects = """
  // GLOBAL UNSAVED CHANGES TRACKER & AUTO-SAVE
  const isDirty = editMode || (unsavedTableIndex !== null) || (iepFormMode === "edit" || iepFormMode === "create") || (editingTherapyReport !== null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Case Record Drafts
  useEffect(() => {
    if (editMode && id && editData) {
      const timer = setTimeout(() => {
        localStorage.setItem(`draft_case_record_${id}`, JSON.stringify({ editData, householdRows, drugRows }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editMode, id, editData, householdRows, drugRows]);

  // IEP Drafts
  useEffect(() => {
    if ((iepFormMode === "create" || iepFormMode === "edit") && id && iepFormDraft) {
      const timer = setTimeout(() => {
        localStorage.setItem(`draft_iep_${id}`, JSON.stringify(iepFormDraft));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [iepFormMode, id, iepFormDraft]);

  // Therapy Report Drafts
  useEffect(() => {
    if (editingTherapyReport && id) {
      const timer = setTimeout(() => {
        localStorage.setItem(`draft_therapy_${id}_${editingTherapyReport.id}`, JSON.stringify({
          editTherapyGoals,
          editTherapyPresentComplaints,
          editTherapyCurrentObservation,
          editTherapyAssessmentDone,
          editTherapyProvisionalDiagnosis,
          editTherapyProgressLevel,
          editTherapyReportDate,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editingTherapyReport, id, editTherapyGoals, editTherapyPresentComplaints, editTherapyCurrentObservation, editTherapyAssessmentDone, editTherapyProvisionalDiagnosis, editTherapyProgressLevel, editTherapyReportDate]);

  // Term Reports Drafts
  useEffect(() => {
    if (unsavedTableIndex !== null && id && savedTables.length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem(`draft_term_reports_${id}`, JSON.stringify({
          savedTables,
          unsavedTableIndex,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [unsavedTableIndex, id, savedTables]);

  // Restore Term Reports Draft on Load
  useEffect(() => {
    if (initialLoadDone && student && id) {
      const draftStr = localStorage.getItem(`draft_term_reports_${id}`);
      if (draftStr) {
        if (window.confirm("You have an unsaved Term Reports draft. Restore it?")) {
          try {
            const parsed = JSON.parse(draftStr);
            setSavedTables(parsed.savedTables);
            setUnsavedTableIndex(parsed.unsavedTableIndex);
          } catch (e) {}
        } else {
          localStorage.removeItem(`draft_term_reports_${id}`);
        }
      }
    }
  }, [initialLoadDone, student, id]);
"""

if '// GLOBAL UNSAVED CHANGES TRACKER & AUTO-SAVE' not in content:
    target = 'const [toast, setToast] = useState({ show: false, message: "", type: "" });'
    content = content.replace(target, target + '\n' + draft_effects)


# 2. Case Record Edit Start (Restore Draft)
old_handle_edit_start = """
  // Start editing: initialize editData
  const handleEditStart = () => {
    if (student) {
      setHouseholdRows(normalizeHouseholdRows(student.household));
      setDrugRows(normalizeDrugRows(student.drug_history));
    }
    setEditMode(true);
  };
"""

new_handle_edit_start = """
  // Start editing: initialize editData
  const handleEditStart = () => {
    const draftStr = localStorage.getItem(`draft_case_record_${id}`);
    if (draftStr) {
      if (window.confirm("You have an unsaved draft of the Case Record from earlier. Do you want to restore it?")) {
         try {
           const parsed = JSON.parse(draftStr);
           if (parsed.editData) setEditData(parsed.editData);
           if (parsed.householdRows) setHouseholdRows(parsed.householdRows);
           if (parsed.drugRows) setDrugRows(parsed.drugRows);
           setEditMode(true);
           return;
         } catch(e) { console.error(e); }
      } else {
        localStorage.removeItem(`draft_case_record_${id}`);
      }
    }
    
    if (student) {
      setHouseholdRows(normalizeHouseholdRows(student.household));
      setDrugRows(normalizeDrugRows(student.drug_history));
    }
    setEditMode(true);
  };
"""

content = content.replace(old_handle_edit_start.strip(), new_handle_edit_start.strip())

# Case Record Save Clear Draft
old_handle_edit_save = """const handleEditSave = async () => {"""
new_handle_edit_save = """const handleEditSave = async () => {
    localStorage.removeItem(`draft_case_record_${id}`);"""
content = content.replace(old_handle_edit_save, new_handle_edit_save)


# 3. IEP Draft Restoration
old_create_iep = """
  const startCreateIepForm = () => {
    setIepFormDraft(createEmptyIepForm());
    setIepFormViewRecord(null);
    setIepFormMode("create");
  };
"""
new_create_iep = """
  const startCreateIepForm = () => {
    const draftStr = localStorage.getItem(`draft_iep_${id}`);
    if (draftStr) {
      if (window.confirm("You have an unsaved IEP draft. Do you want to restore it?")) {
        try {
          const parsed = JSON.parse(draftStr);
          setIepFormDraft(parsed);
          setIepFormViewRecord(null);
          setIepFormMode("create");
          return;
        } catch(e) { console.error(e); }
      } else {
        localStorage.removeItem(`draft_iep_${id}`);
      }
    }
    setIepFormDraft(createEmptyIepForm());
    setIepFormViewRecord(null);
    setIepFormMode("create");
  };
"""

old_edit_iep = """
  const startEditIepForm = (record) => {
    setIepFormDraft(normalizeIepRecord(record));
    setIepFormViewRecord(null);
    setIepFormMode("edit");
  };
"""
new_edit_iep = """
  const startEditIepForm = (record) => {
    const draftStr = localStorage.getItem(`draft_iep_${id}`);
    if (draftStr) {
      if (window.confirm("You have an unsaved IEP draft. Do you want to restore it?")) {
        try {
          const parsed = JSON.parse(draftStr);
          setIepFormDraft(parsed);
          setIepFormViewRecord(null);
          setIepFormMode("edit");
          return;
        } catch(e) { console.error(e); }
      } else {
        localStorage.removeItem(`draft_iep_${id}`);
      }
    }
    setIepFormDraft(normalizeIepRecord(record));
    setIepFormViewRecord(null);
    setIepFormMode("edit");
  };
"""

content = content.replace(old_create_iep.strip(), new_create_iep.strip())
content = content.replace(old_edit_iep.strip(), new_edit_iep.strip())

# Clear IEP Draft on Save
old_save_iep = """const handleIepSave = async () => {"""
new_save_iep = """const handleIepSave = async () => {
    localStorage.removeItem(`draft_iep_${id}`);"""
content = content.replace(old_save_iep, new_save_iep)


# 4. Therapy Report Draft Restoration
pattern_therapy = r'''onClick=\{\(\) => \{\s*setEditingTherapyReport\(r\);\s*setEditTherapyReportDate\(r\.report_date\);\s*setEditTherapyPresentComplaints\(r\.present_complaints \|\| ""\);\s*setEditTherapyCurrentObservation\(r\.current_observation \|\| ""\);\s*setEditTherapyAssessmentDone\(r\.assessment_done \|\| ""\);\s*setEditTherapyProvisionalDiagnosis\(r\.provisional_diagnosis \|\| ""\);\s*setEditTherapyProgressLevel\(r\.progress_level \|\| "Excellent"\);\s*setEditTherapyGoals\(r\.goals_achieved \|\| \{\}\);\s*setEditTherapyError\(null\);\s*\}\}'''

new_therapy_onClick = '''onClick={() => {
                                        const draftStr = localStorage.getItem(`draft_therapy_${id}_${r.id}`);
                                        if (draftStr) {
                                          if (window.confirm("You have an unsaved draft for this therapy report. Restore it?")) {
                                            try {
                                              const parsed = JSON.parse(draftStr);
                                              setEditingTherapyReport(r);
                                              setEditTherapyGoals(parsed.editTherapyGoals || {});
                                              setEditTherapyPresentComplaints(parsed.editTherapyPresentComplaints || "");
                                              setEditTherapyCurrentObservation(parsed.editTherapyCurrentObservation || "");
                                              setEditTherapyAssessmentDone(parsed.editTherapyAssessmentDone || "");
                                              setEditTherapyProvisionalDiagnosis(parsed.editTherapyProvisionalDiagnosis || "");
                                              setEditTherapyProgressLevel(parsed.editTherapyProgressLevel || "Excellent");
                                              setEditTherapyReportDate(parsed.editTherapyReportDate || "");
                                              setEditTherapyError(null);
                                              return;
                                            } catch(e) {}
                                          } else {
                                            localStorage.removeItem(`draft_therapy_${id}_${r.id}`);
                                          }
                                        }
                                        setEditingTherapyReport(r);
                                        setEditTherapyReportDate(r.report_date);
                                        setEditTherapyPresentComplaints(r.present_complaints || "");
                                        setEditTherapyCurrentObservation(r.current_observation || "");
                                        setEditTherapyAssessmentDone(r.assessment_done || "");
                                        setEditTherapyProvisionalDiagnosis(r.provisional_diagnosis || "");
                                        setEditTherapyProgressLevel(r.progress_level || "Excellent");
                                        setEditTherapyGoals(r.goals_achieved || {});
                                        setEditTherapyError(null);
                                      }}'''
content = re.sub(pattern_therapy, new_therapy_onClick.replace('\\', '\\\\'), content)

# Clear Therapy Draft on Save
old_save_therapy = """const handleEditTherapyReportSave = async (e) => {"""
new_save_therapy = """const handleEditTherapyReportSave = async (e) => {
    if (editingTherapyReport) localStorage.removeItem(`draft_therapy_${id}_${editingTherapyReport.id}`);"""
content = content.replace(old_save_therapy, new_save_therapy)

# Clear Term Report Draft on save
old_save_table = """const saveTable = async (tableIndex) => {"""
new_save_table = """const saveTable = async (tableIndex) => {
    localStorage.removeItem(`draft_term_reports_${id}`);"""
content = content.replace(old_save_table, new_save_table)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
