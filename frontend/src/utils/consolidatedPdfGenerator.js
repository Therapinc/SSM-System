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
 * @param {object|null} params.aiSummary - Synthesized multi-disciplinary clinical summary from Gemini
 */
export const generateConsolidatedReportPDF = async ({
  student,
  period,
  therapyReports = [],
  savedIepByMonth = {},
  iepProgramRecords = [],
  savedTables = [],
  aiSummary = null,
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
      if (schoolLogo) {
        doc.addImage(schoolLogo, "PNG", pb.margins.left, pb.y, logoW, logoH);
      }
    } catch (e) {
      // Fallback
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

    pb.y += 64;
    pb.addSeparator();
  };

  drawSchoolHeader();

  // ── Section 1: Reporting Period & Student Demographics ──
  pb.addHeading("1. STUDENT IDENTIFICATION & REPORTING PERIOD", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

  // Use a structured key-value table to guarantee zero overlap and clean word wrapping
  const periodTitle = `${sanitizeText(period.title || "Term Evaluation")} (${period.fromDate || "N/A"} to ${period.toDate || "N/A"})`;
  const academicYear = sanitizeText(student?.academicYear || student?.academic_year || period.academicYear || "2026-2027");
  const studentName = sanitizeText(student?.name || "N/A");
  const rollNo = sanitizeText(student?.roll_no || student?.student_id || student?.id || "N/A");
  const classDiv = `${sanitizeText(student?.class_name || "N/A")} - ${sanitizeText(student?.division || "N/A")}`;
  const diagText = sanitizeText(student?.diagnosis || student?.disability_type || "Intellectual & Developmental Disability");

  const demoColWidths = [105, 195, 95, 120]; // Total = 515 pt = exact content width
  const demoRows = [
    ["Reporting Period:", periodTitle, "Academic Year:", academicYear],
    ["Student Name:", studentName, "Roll / ID:", rollNo],
    ["Class & Division:", classDiv, "Diagnosis:", diagText],
  ];

  pb.addTable(["Field", "Detail", "Property", "Value"], demoRows, {
    colWidths: demoColWidths,
    fontSize: 9,
    headerFontSize: 9,
    cellPadding: 3.5,
    lineHeight: 12,
  });

  pb.addGap(6);
  pb.addSeparator();

  // ── Section 2: AI Multi-Disciplinary Clinical Synthesis ──
  if (aiSummary && (aiSummary.executive_summary || aiSummary.interdisciplinary_synergy)) {
    pb.ensureSpace(120);
    pb.addHeading("2. MULTI-DISCIPLINARY CLINICAL SYNTHESIS (AI-POWERED)", { fontSize: 11, gapBefore: 6, gapAfter: 6 });

    // AI Badge & Disclaimer
    const modelLabel = aiSummary.model ? ` [Engine: ${aiSummary.model}]` : " [Engine: Gemini AI]";
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Synthesized via Google Gemini Clinical Intelligence${modelLabel} | Evaluation Span: ${period.fromDate || "N/A"} to ${period.toDate || "N/A"}`,
      pb.margins.left + 4,
      pb.y
    );
    doc.setTextColor(0, 0, 0);
    pb.y += 12;

    // Executive Summary
    if (aiSummary.executive_summary) {
      pb.addSubHeading("A. Executive Developmental Narrative", { fontSize: 10 });
      pb.addText(aiSummary.executive_summary, {
        indent: 6,
        lineHeight: 13,
        fontSize: 9.5,
      });
      pb.addGap(4);
    }

    // Interdisciplinary Synergy
    if (aiSummary.interdisciplinary_synergy) {
      pb.ensureSpace(60);
      pb.addSubHeading("B. Interdisciplinary Synergy & Functional Adaptation", { fontSize: 10 });
      pb.addText(aiSummary.interdisciplinary_synergy, {
        indent: 6,
        lineHeight: 13,
        fontSize: 9.5,
      });
      pb.addGap(4);
    }

    // Coordinated Term Recommendations
    if (aiSummary.term_recommendations && Array.isArray(aiSummary.term_recommendations) && aiSummary.term_recommendations.length > 0) {
      pb.ensureSpace(65);
      pb.addSubHeading("C. Coordinated Multi-Disciplinary Recommendations for Next Term", { fontSize: 10 });
      aiSummary.term_recommendations.forEach((rec) => {
        pb.addText(`• ${rec}`, {
          indent: 10,
          lineHeight: 12,
          fontSize: 9,
        });
      });
    }

    pb.addGap(6);
    pb.addSeparator();
  }

  // ── Section 3: Multi-Disciplinary Therapy Progress ──
  const brokeTherapy = pb.ensureSpace(120);
  if (!brokeTherapy) pb.addSeparator();
  const therapyHeadingNum = aiSummary ? "3" : "2";
  pb.addHeading(`${therapyHeadingNum}. MULTI-DISCIPLINARY THERAPY PROGRESS`, { fontSize: 11, gapBefore: 8, gapAfter: 6 });

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
      pb.ensureSpace(75);
      pb.addSubHeading(`${therapyType.toUpperCase()} (${sessions.length} sessions recorded)`, { fontSize: 10 });

      // If AI produced discipline-specific synthesis, render it here
      const discAi = aiSummary?.disciplines?.[therapyType] || aiSummary?.disciplines?.[therapyType.toLowerCase()];
      if (discAi && discAi.summary) {
        pb.addText(`Clinical Synthesis: ${discAi.summary}`, {
          indent: 6,
          fontSize: 9,
          lineHeight: 12,
          bold: false,
        });
        if (discAi.key_achievements && Array.isArray(discAi.key_achievements)) {
          discAi.key_achievements.forEach((ach) => {
            pb.addText(`• ${ach}`, { indent: 12, fontSize: 8.5, lineHeight: 11 });
          });
        }
        pb.addGap(3);
      }

      // Gather distinct goals and responses from DB
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

  // ── Section 4: Educational & Activities of Daily Living (ADL) Progress ──
  const brokeEd = pb.ensureSpace(130);
  if (!brokeEd) pb.addSeparator();
  const edHeadingNum = aiSummary ? "4" : "3";
  pb.addHeading(`${edHeadingNum}. EDUCATIONAL & ACTIVITIES OF DAILY LIVING (ADL) PROGRESS`, { fontSize: 11, gapBefore: 8, gapAfter: 6 });

  // Find all monthly term reports that fall within the selected 6-month period
  const matchingMonths = Object.keys(savedIepByMonth).filter((monthKey) => {
    const parsed = Date.parse(`1 ${monthKey}`);
    if (isNaN(parsed)) return true;
    const mDate = new Date(parsed);
    if (fromD && mDate < new Date(fromD.getFullYear(), fromD.getMonth(), 1)) return false;
    if (toD && mDate > new Date(toD.getFullYear(), toD.getMonth() + 1, 0)) return false;
    return true;
  });

  // Sort months chronologically
  const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  matchingMonths.sort((a, b) => {
    const partsA = a.split(" ");
    const partsB = b.split(" ");
    const yearA = parseInt(partsA[1], 10) || 0;
    const yearB = parseInt(partsB[1], 10) || 0;
    if (yearA !== yearB) return yearA - yearB;
    return monthOrder.indexOf(partsA[0]) - monthOrder.indexOf(partsB[0]);
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

    const edAi = aiSummary?.disciplines?.["Educational & ADL Progress"] || aiSummary?.disciplines?.["Educational and ADL"];
    if (edAi && edAi.summary) {
      pb.addText(`Educational Synthesis: ${edAi.summary}`, {
        indent: 6,
        fontSize: 9,
        lineHeight: 12,
      });
      pb.addGap(3);
    }

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
    pb.ensureSpace(55);
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
    pb.ensureSpace(55);
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
    pb.ensureSpace(55);
    pb.addSubHeading("C. Behavioral, Social Interaction & Classroom Adaptation", { fontSize: 10 });
    if (behavioralItems.length > 0) {
      behavioralItems.slice(0, 4).forEach((txt) => {
        pb.addText(txt, { indent: 10, fontSize: 9, lineHeight: 12 });
      });
    } else {
      pb.addText("Showing positive engagement with consistent classroom structure and routine reinforcement.", { indent: 10, fontSize: 9 });
    }
  }

  // ── Section 5: Individualized Education Program (IEP Goals) ──
  const brokeIep = pb.ensureSpace(120);
  if (!brokeIep) pb.addSeparator();
  const iepHeadingNum = aiSummary ? "5" : "4";
  pb.addHeading(`${iepHeadingNum}. INDIVIDUALIZED EDUCATION PROGRAM (IEP) TARGET STATUS`, { fontSize: 11, gapBefore: 8, gapAfter: 6 });

  const activeRecord = iepProgramRecords && iepProgramRecords.length > 0 ? iepProgramRecords[0] : null;

  const tableHeaders = ["Term / Domain", "Target Objective / Task", "Milestone Progress"];
  const tableRows = [];

  if (activeRecord) {
    if (activeRecord.terms && Array.isArray(activeRecord.terms)) {
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
    } else if (activeRecord.firstTerm || activeRecord.secondTerm) {
      ["firstTerm", "secondTerm"].forEach((termKey) => {
        const t = activeRecord[termKey];
        if (t && t.headers && t.headers.length > 0) {
          const termLabel = termKey === "firstTerm" ? "First Term" : "Second Term";
          t.headers.forEach((h, hIdx) => {
            const colGoals = (t.rows || []).map((r) => r[`col_${hIdx}`] || "").filter(Boolean);
            const goalPreview = colGoals.length > 0 ? colGoals.slice(0, 2).join("; ") : (t.shortTermGoal || "Ongoing evaluation");
            tableRows.push([
              termLabel,
              sanitizeText(h),
              sanitizeText(goalPreview),
            ]);
          });
        }
      });
    }
  }

  if (tableRows.length > 0) {
    pb.addTable(tableHeaders, tableRows.slice(0, 6), {
      colWidths: [contentW * 0.25, contentW * 0.45, contentW * 0.30],
      fontSize: 8.5,
      cellPadding: 4,
      lineHeight: 12,
    });
  } else {
    pb.addText("No formalized IEP Program term milestones currently catalogued for this period.", { color: [100, 100, 100], indent: 8 });
    pb.addGap(6);
  }

  // ── Section 6: Special Education Functional Assessment (FACP Summary) ──
  const brokeFacp = pb.ensureSpace(100);
  if (!brokeFacp) pb.addSeparator();
  const facpHeadingNum = aiSummary ? "6" : "5";
  pb.addHeading(`${facpHeadingNum}. FUNCTIONAL SKILLS ASSESSMENT (FACP SUMMARY)`, { fontSize: 11, gapBefore: 8, gapAfter: 6 });

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

  // ── Section 7: Consolidated Multi-Disciplinary Signatures ──
  pb.ensureSpace(100);
  pb.addSeparator();
  const sigHeadingNum = aiSummary ? "7" : "6";
  pb.addHeading(`${sigHeadingNum}. MULTI-DISCIPLINARY ATTESTATION & SIGNATURES`, { fontSize: 11, gapBefore: 8, gapAfter: 12 });

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
    null
  );

  // Save PDF
  const safeName = sanitizeText(student?.name || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeName}_Consolidated_Report_${(period.title || "Term").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
};
