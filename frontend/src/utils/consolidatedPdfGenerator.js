import jsPDF from "jspdf";
import { sanitizeText, PdfBuilder } from "./pdfBuilder";
import schoolLogo from "../images/logo.png";

/**
 * Generate Consolidated Multi-Disciplinary Progress Report (6-Month / Semester Span)
 * 
 * @param {object} params
 * @param {object} params.student - Student details object
 * @param {object} params.period - { title, fromDate, toDate, academicYear }
 * @param {Array} params.therapyReports - Array of therapy report objects
 * @param {object} params.savedIepByMonth - Keyed map of monthly trimester IEP reports
 * @param {Array} params.iepProgramRecords - Array of IEP program records with terms & goals
 * @param {Array} params.savedTables - Array of Special Education FACP evaluation tables
 */
export const generateConsolidatedReportPDF = async ({
  student,
  period,
  therapyReports = [],
  savedIepByMonth = {},
  iepProgramRecords = [],
  savedTables = [],
}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pb = new PdfBuilder(doc, {
    margins: { top: 35, bottom: 40, left: 35, right: 35 },
    lineHeight: 14,
    fontSize: 10,
    fontFamily: "times",
  });

  const pageW = pb.pageW;
  const contentW = pb.contentW;
  const fromD = period.fromDate ? new Date(period.fromDate) : null;
  const toD = period.toDate ? new Date(period.toDate) : null;

  // ── Header & Institution Banner ──
  const drawSchoolHeader = () => {
    const logoW = 55;
    const logoH = 55;
    try {
      doc.addImage(schoolLogo, "PNG", pb.margins.left, pb.y, logoW, logoH);
    } catch (e) {
      // Ignore if image load fails
    }

    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text("ST. MARTHA'S SPECIAL SCHOOL", pageW / 2 + 15, pb.y + 14, { align: "center" });
    
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("FOR PERSONS WITH INTELLECTUAL AND DEVELOPMENTAL DISABILITIES", pageW / 2 + 15, pb.y + 28, { align: "center" });
    
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(227, 139, 82); // School warm brand color
    doc.text("MULTI-DISCIPLINARY CONSOLIDATED PROGRESS REPORT", pageW / 2 + 15, pb.y + 44, { align: "center" });
    doc.setTextColor(0, 0, 0);

    pb.y += 68;
    pb.addSeparator();
  };

  drawSchoolHeader();

  // ── Reporting Period & Student Demographics ──
  pb.addHeading("1. STUDENT IDENTIFICATION & REPORTING PERIOD", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

  // 2-Column Metadata Box
  const col1X = pb.margins.left;
  const col2X = pb.margins.left + contentW / 2 + 10;
  const metaY = pb.y;

  doc.setFontSize(10);
  doc.setFont("times", "bold");
  doc.text("Reporting Period:", col1X, metaY);
  doc.setFont("times", "normal");
  doc.text(`${sanitizeText(period.title || "Term Evaluation")} (${period.fromDate || "N/A"} to ${period.toDate || "N/A"})`, col1X + 85, metaY);

  doc.setFont("times", "bold");
  doc.text("Academic Year:", col2X, metaY);
  doc.setFont("times", "normal");
  doc.text(`${sanitizeText(student?.academicYear || student?.academic_year || period.academicYear || "2026-2027")}`, col2X + 80, metaY);

  const row2Y = metaY + 16;
  doc.setFont("times", "bold");
  doc.text("Student Name:", col1X, row2Y);
  doc.setFont("times", "normal");
  doc.text(`${sanitizeText(student?.name || "N/A")}`, col1X + 85, row2Y);

  doc.setFont("times", "bold");
  doc.text("Roll / ID:", col2X, row2Y);
  doc.setFont("times", "normal");
  doc.text(`${sanitizeText(student?.roll_no || student?.student_id || "N/A")}`, col2X + 80, row2Y);

  const row3Y = metaY + 32;
  doc.setFont("times", "bold");
  doc.text("Class & Division:", col1X, row3Y);
  doc.setFont("times", "normal");
  doc.text(`${sanitizeText(student?.class_name || "N/A")} - ${sanitizeText(student?.division || "N/A")}`, col1X + 85, row3Y);

  doc.setFont("times", "bold");
  doc.text("Diagnosis:", col2X, row3Y);
  doc.setFont("times", "normal");
  const diagText = sanitizeText(student?.diagnosis || student?.disability_type || "Intellectual Disability");
  doc.text(diagText.length > 25 ? `${diagText.substring(0, 25)}...` : diagText, col2X + 80, row3Y);

  pb.y = row3Y + 22;
  pb.addSeparator();

  // ── Section 2: Multi-Disciplinary Therapy Progress ──
  pb.addHeading("2. MULTI-DISCIPLINARY THERAPY PROGRESS", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

  // Filter therapy reports for the selected 6-month period
  const filteredTherapies = therapyReports.filter((r) => {
    if (!r.report_date) return false;
    const rDate = new Date(r.report_date);
    if (fromD && rDate < fromD) return false;
    if (toD && rDate > toD) return false;
    return true;
  });

  if (filteredTherapies.length === 0) {
    pb.addText("No therapy sessions recorded for this evaluation period.", { color: [100, 100, 100], indent: 8 });
    pb.addGap(6);
  } else {
    // Group therapy sessions by specialization/type
    const therapyGroups = {};
    filteredTherapies.forEach((r) => {
      const type = (r.therapy_type || "General Therapy").trim();
      if (!therapyGroups[type]) therapyGroups[type] = [];
      therapyGroups[type].push(r);
    });

    Object.entries(therapyGroups).forEach(([therapyType, sessions]) => {
      pb.ensureSpace(60);
      pb.addSubHeading(`${therapyType.toUpperCase()} (${sessions.length} sessions recorded)`, { fontSize: 10 });

      // Gather distinct goals and responses
      const distinctGoals = [];
      const progressCounts = { Excellent: 0, Good: 0, Moderate: 0, "Needs Improvement": 0 };

      sessions.forEach((s) => {
        if (s.progress_level && progressCounts[s.progress_level] !== undefined) {
          progressCounts[s.progress_level]++;
        }
        const goalsData = s.goals || s.goals_achieved;
        if (goalsData && typeof goalsData === "object") {
          Object.entries(goalsData).forEach(([k, g]) => {
            if (g && (g.notes || g.response)) {
              distinctGoals.push({
                domain: k,
                goal: g.notes || "",
                response: g.response || "",
              });
            }
          });
        } else if (s.current_observation || s.progress_notes) {
          distinctGoals.push({
            domain: "observation",
            goal: s.current_observation || s.progress_notes || "",
            response: s.progress_level || "Active",
          });
        }
      });

      // Calculate primary progress rating
      let predominantRating = "Good";
      let maxCount = -1;
      Object.entries(progressCounts).forEach(([rating, count]) => {
        if (count > maxCount && count > 0) {
          maxCount = count;
          predominantRating = rating;
        }
      });

      pb.addText(`* Overall Period Rating: ${predominantRating} | Total Documented Sessions: ${sessions.length}`, {
        bold: true,
        indent: 6,
        lineHeight: 13,
      });

      // Sample up to 4 key goals worked on
      if (distinctGoals.length > 0) {
        pb.addText("Key Interventions & Responses:", { bold: true, indent: 6, lineHeight: 13 });
        const sampledGoals = distinctGoals.slice(0, 4);
        sampledGoals.forEach((item) => {
          const goalStr = item.goal ? `Goal: ${item.goal.trim()}` : "";
          const respStr = item.response ? ` | Response: ${item.response.trim()}` : "";
          pb.addText(`- ${goalStr}${respStr}`, { indent: 12, lineHeight: 12, fontSize: 9 });
        });
      } else {
        pb.addText("Sessions logged with continuous guided sensory and functional exercises.", {
          indent: 12,
          fontSize: 9,
          lineHeight: 12,
        });
      }
      pb.addGap(6);
    });
  }

  pb.addSeparator();

  // ── Section 3: Educational & Developmental Evaluation (Term Reports) ──
  pb.addHeading("3. EDUCATIONAL & ACTIVITIES OF DAILY LIVING (ADL) PROGRESS", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

  // Find all monthly term reports that fall within the selected 6-month period
  const matchingMonths = Object.keys(savedIepByMonth).filter((monthKey) => {
    const parsed = Date.parse(`1 ${monthKey}`);
    if (isNaN(parsed)) return true;
    const mDate = new Date(parsed);
    if (fromD && mDate < new Date(fromD.getFullYear(), fromD.getMonth(), 1)) return false;
    if (toD && mDate > new Date(toD.getFullYear(), toD.getMonth() + 1, 0)) return false;
    return true;
  });

  if (matchingMonths.length === 0) {
    pb.addText("No monthly term reports recorded within this evaluation window.", { color: [100, 100, 100], indent: 8 });
    pb.addGap(6);
  } else {
    pb.addText(`Monthly evaluations consolidated across: ${matchingMonths.join(", ")}`, {
      bold: true,
      indent: 6,
      lineHeight: 13,
    });
    pb.addGap(4);

    const adlItems = [];
    const academicItems = [];
    const behavioralItems = [];

    matchingMonths.forEach((mKey) => {
      const rep = savedIepByMonth[mKey];
      if (rep && rep.sections) {
        (rep.sections.adlSkills || []).forEach((item) => {
          if (item?.text && item.text.trim()) adlItems.push(`[${mKey}] ${item.text.trim()}`);
        });
        (rep.sections.academic || []).forEach((item) => {
          if (item?.text && item.text.trim()) academicItems.push(`[${mKey}] ${item.text.trim()}`);
        });
        (rep.sections.behaviouralSkills || []).forEach((item) => {
          if (item?.text && item.text.trim()) behavioralItems.push(`[${mKey}] ${item.text.trim()}`);
        });
      }
    });

    // Render ADL Summary
    pb.ensureSpace(50);
    pb.addSubHeading("A. Activities of Daily Living (Eating, Drinking, Hygiene & Toileting)", { fontSize: 10 });
    if (adlItems.length > 0) {
      adlItems.slice(0, 4).forEach((txt) => {
        pb.addText(txt, { indent: 10, fontSize: 9, lineHeight: 12 });
      });
    } else {
      pb.addText("Demonstrating routine progress in personal care and classroom independence.", { indent: 10, fontSize: 9 });
    }
    pb.addGap(4);

    // Render Academic Skills Summary
    pb.ensureSpace(50);
    pb.addSubHeading("B. Cognitive, Fine Motor & Academic Development", { fontSize: 10 });
    if (academicItems.length > 0) {
      academicItems.slice(0, 4).forEach((txt) => {
        pb.addText(txt, { indent: 10, fontSize: 9, lineHeight: 12 });
      });
    } else {
      pb.addText("Participating with continuous teacher guidance in structured pre-academic tasks.", { indent: 10, fontSize: 9 });
    }
    pb.addGap(4);

    // Render Behavioral Skills Summary
    pb.ensureSpace(50);
    pb.addSubHeading("C. Behavioral, Social Interaction & Classroom Adaptation", { fontSize: 10 });
    if (behavioralItems.length > 0) {
      behavioralItems.slice(0, 4).forEach((txt) => {
        pb.addText(txt, { indent: 10, fontSize: 9, lineHeight: 12 });
      });
    } else {
      pb.addText("Showing positive engagement with consistent classroom structure and routine reinforcement.", { indent: 10, fontSize: 9 });
    }
  }

  pb.addGap(6);
  pb.addSeparator();

  // ── Section 4: Individualized Education Program (IEP Goals) ──
  pb.addHeading("4. INDIVIDUALIZED EDUCATION PROGRAM (IEP) TARGET STATUS", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

  const activeRecord = iepProgramRecords && iepProgramRecords.length > 0 ? iepProgramRecords[0] : null;

  if (!activeRecord || !activeRecord.terms || activeRecord.terms.length === 0) {
    pb.addText("No formalized IEP Program term milestones currently catalogued for this period.", { color: [100, 100, 100], indent: 8 });
    pb.addGap(6);
  } else {
    const tableHeaders = ["Term / Domain", "Target Objective / Task", "Milestone Progress"];
    const tableRows = [];

    activeRecord.terms.forEach((t) => {
      const termName = t.termName || "Academic Term";
      if (t.headers && t.headers.length > 0) {
        t.headers.forEach((h, hIdx) => {
          const colGoals = (t.goals || []).map((g) => g[`col_${hIdx}`] || "").filter(Boolean);
          const goalPreview = colGoals.length > 0 ? colGoals.slice(0, 2).join("; ") : "Continuous functional training";
          tableRows.push([
            termName,
            sanitizeText(h),
            sanitizeText(goalPreview),
          ]);
        });
      }
    });

    if (tableRows.length > 0) {
      pb.addTable(tableHeaders, tableRows.slice(0, 6), {
        colWidths: [contentW * 0.25, contentW * 0.45, contentW * 0.30],
        fontSize: 8.5,
        cellPadding: 4,
        lineHeight: 12,
      });
    } else {
      pb.addText("All targeted IEP objectives are actively undergoing instruction and evaluation.", { indent: 8, fontSize: 9 });
    }
  }

  pb.addGap(6);
  pb.addSeparator();

  // ── Section 5: Special Education Functional Assessment (FACP Summary) ──
  pb.addHeading("5. FUNCTIONAL SKILLS ASSESSMENT (FACP SUMMARY)", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

  if (!savedTables || savedTables.length === 0) {
    pb.addText("Special education functional checklist pending active quarter completion.", { color: [100, 100, 100], indent: 8 });
    pb.addGap(6);
  } else {
    let totalSkillsEvaluated = 0;
    let independentMastered = 0;

    savedTables.forEach((tbl) => {
      const rows = tbl.rows || [];
      totalSkillsEvaluated += rows.length;
      rows.forEach((r) => {
        const val = r["1"] || r["Session 1"] || r["Assessment 1"] || "";
        if (String(val).trim().toUpperCase() === "A") {
          independentMastered++;
        }
      });
    });

    pb.addText(`- Functional Skill Areas Tracked: ${savedTables.length} domain checklists`, { indent: 8, bold: true, lineHeight: 13 });
    pb.addText(`- Total Skills Assessed: ${totalSkillsEvaluated} items | Independent Mastery Level ('A'): ${independentMastered} skills`, { indent: 8, lineHeight: 13 });
    pb.addText("- Skills marked with 'B' are actively supported through graded prompts and physical assistance.", { indent: 8, fontSize: 9, lineHeight: 12 });
  }

  pb.addGap(10);
  pb.addSeparator();

  // ── Section 6: Consolidated Multi-Disciplinary Signatures ──
  pb.ensureSpace(85);
  pb.addHeading("6. MULTI-DISCIPLINARY ATTESTATION & SIGNATURES", { fontSize: 11, gapBefore: 6, gapAfter: 12 });

  const sigY = pb.y + 25;
  const sigColW = contentW / 4;

  const signatures = [
    { label: "Class Teacher", x: pb.margins.left },
    { label: "Special Educator", x: pb.margins.left + sigColW },
    { label: "Head of Therapy", x: pb.margins.left + sigColW * 2 },
    { label: "Principal", x: pb.margins.left + sigColW * 3 },
  ];

  signatures.forEach((sig) => {
    doc.setLineWidth(0.6);
    doc.line(sig.x, sigY, sig.x + sigColW - 15, sigY);
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.text(sig.label, sig.x + (sigColW - 15) / 2, sigY + 12, { align: "center" });
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text("St. Martha's Special School", sig.x + (sigColW - 15) / 2, sigY + 22, { align: "center" });
  });

  // Footer with Page Numbers
  pb.addFooters(
    `St. Martha's Special School - Multi-Disciplinary Consolidated Report (${sanitizeText(student?.name || "Student")})`,
    true
  );

  // Save PDF
  const safeName = sanitizeText(student?.name || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeName}_Consolidated_Report_${(period.title || "Term").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
};
