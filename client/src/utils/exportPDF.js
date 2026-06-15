/**
 * PDF Export Utilities using jsPDF + jsPDF-AutoTable
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SRM_PURPLE = [108, 99, 255];
const DARK       = [30, 30, 58];
const GRAY       = [148, 163, 184];

function addHeader(doc, title, subtitle = '') {
  // Purple header bar
  doc.setFillColor(...SRM_PURPLE);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SRM Todo App', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);
  if (subtitle) doc.text(subtitle, 14, 26);

  // Timestamp (right side)
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, 170, 12);

  // Reset color
  doc.setTextColor(...DARK);
  return 35; // return y offset after header
}

// ── Export Todos as PDF ──────────────────────────────────
export const exportTodosPDF = (todos, userName = '') => {
  const doc = new jsPDF();
  const y = addHeader(doc, 'My Todo List', `User: ${userName}`);

  const rows = todos.map(t => [
    t.title,
    t.priority,
    t.category,
    t.completed ? 'Done ✓' : 'Pending',
    t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '-',
  ]);

  autoTable(doc, {
    startY: y,
    head:   [['Title', 'Priority', 'Category', 'Status', 'Due Date']],
    body:   rows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: SRM_PURPLE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 70 },
      3: { fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.text[0];
        if (val.includes('Done')) data.cell.styles.textColor = [16, 185, 129];
        else data.cell.styles.textColor = [245, 158, 11];
      }
    },
  });

  // Summary footer
  const done    = todos.filter(t => t.completed).length;
  const pending = todos.length - done;
  const finalY  = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SRM_PURPLE);
  doc.text(`Total: ${todos.length}  ·  Completed: ${done}  ·  Pending: ${pending}`, 14, finalY);

  doc.save(`srm_todos_${Date.now()}.pdf`);
};

// ── Export Attendance as PDF ─────────────────────────────
export const exportAttendancePDF = (records, userName = '') => {
  const doc = new jsPDF();
  const y = addHeader(doc, 'Attendance Report', `Student: ${userName}`);

  const rows = records.map(r => {
    const pct = r.percentage ?? (r.totalClasses > 0
      ? ((r.attendedClasses / r.totalClasses) * 100).toFixed(1)
      : 0);
    return [
      r.subject,
      r.totalClasses,
      r.attendedClasses,
      `${pct}%`,
      pct >= 75 ? 'Safe' : pct >= 65 ? 'Warning' : 'Danger',
    ];
  });

  autoTable(doc, {
    startY: y,
    head:   [['Subject', 'Total', 'Attended', 'Percentage', 'Status']],
    body:   rows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: SRM_PURPLE, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: 70 } },
  });

  // Overall
  const overall = records.length > 0
    ? (records.reduce((s, r) => s + (r.percentage ?? 0), 0) / records.length).toFixed(1)
    : 0;
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SRM_PURPLE);
  doc.text(`Overall Attendance: ${overall}%`, 14, finalY);

  doc.save(`srm_attendance_${Date.now()}.pdf`);
};

// ── Export IA Tracker as PDF ─────────────────────────────
export const exportIAPDF = (records, userName = '') => {
  const doc = new jsPDF();
  const y = addHeader(doc, 'Internal Assessment Report', `Student: ${userName}`);

  const rows = records.map(r => {
    const best = [r.ia1, r.ia2, r.ia3].sort((a,b) => b-a);
    const avg  = ((best[0] + best[1]) / 2).toFixed(2);
    return [r.subject, r.subjectCode || '-', r.semester, r.ia1, r.ia2, r.ia3, avg, r.grade || '-', r.gradePoint || 0, r.credits || 3];
  });

  const cgpa = records.length
    ? (records.reduce((s,r) => s + (r.gradePoint||0) * (r.credits||3), 0) /
       records.reduce((s,r) => s + (r.credits||3), 0)).toFixed(2)
    : 0;

  autoTable(doc, {
    startY: y,
    head:   [['Subject','Code','Sem','IA1','IA2','IA3','Best Avg','Grade','GP','Cr']],
    body:   rows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: SRM_PURPLE, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SRM_PURPLE);
  doc.text(`CGPA: ${cgpa}`, 14, finalY);

  doc.save(`srm_ia_report_${Date.now()}.pdf`);
};
