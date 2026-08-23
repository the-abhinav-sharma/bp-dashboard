import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BpLog {
  id?: number;
  systolic: number | null;
  diastolic: number | null;
  pulse?: number | null;
  timeOfDay?: string;
  readingDate: string | Date;
  notes?: string;
}

// Safely parse date strings or objects without UTC timezone shifts
const parseLogDate = (dateVal: string | Date): Date => {
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string' && dateVal.includes('T')) {
    return new Date(dateVal);
  }
  // Replace hyphens to avoid UTC interpretation for YYYY-MM-DD
  return new Date(String(dateVal).replace(/-/g, '/'));
};

// Group logs into distinct, non-overlapping date ranges
const groupLogsByTimeframe = (logs: BpLog[]) => {
  const now = new Date();
  
  // Set boundary thresholds (at midnight for clean day comparisons)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 365);

  // Sort logs descending (newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => parseLogDate(b.readingDate).getTime() - parseLogDate(a.readingDate).getTime()
  );

  return {
    // Last 7 days
    weekly: sortedLogs.filter((l) => {
      const d = parseLogDate(l.readingDate);
      return d >= sevenDaysAgo;
    }),
    // Days 8 to 30 (Older than 7 days, up to 30 days)
    monthly: sortedLogs.filter((l) => {
      const d = parseLogDate(l.readingDate);
      return d < sevenDaysAgo && d >= thirtyDaysAgo;
    }),
    // Days 31 to 365 (Older than 30 days, up to 1 year)
    yearly: sortedLogs.filter((l) => {
      const d = parseLogDate(l.readingDate);
      return d < thirtyDaysAgo && d >= oneYearAgo;
    }),
  };
};

export const generateBpPdf = (
  logs: BpLog[],
  patientName: string = 'Patient',
  chartBase64Image?: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let currentY = 15;

  // Header Banner
  doc.setFontSize(20);
  doc.setTextColor(40, 116, 240); // Accent blue
  doc.text('Blood Pressure Summary Report', 14, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Patient: ${patientName} | Generated: ${new Date().toLocaleDateString()}`, 14, currentY);
  currentY += 10;

  // 1. Embed Chart Image if provided
  if (chartBase64Image) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Blood Pressure Trends (Visual Chart)', 14, currentY);
    currentY += 4;

    // Add Image (x, y, width, height)
    doc.addImage(chartBase64Image, 'PNG', 14, currentY, 180, 75);
    currentY += 82;
  }

  // 2. Group Data into distinct buckets
  const grouped = groupLogsByTimeframe(logs);

  const renderSectionTable = (title: string, data: BpLog[]) => {
    // Add page break if running out of space
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(`${title} (${data.length} logs)`, 14, currentY);
    currentY += 4;

    if (data.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('No readings recorded in this range.', 14, currentY + 4);
      currentY += 12;
      return;
    }

    const tableRows = data.map((log) => {
      const formattedDate = parseLogDate(log.readingDate).toLocaleDateString();
      const timeStr = log.timeOfDay ? ` (${log.timeOfDay})` : '';
      const bpStr =
        log.systolic && log.diastolic
          ? `${log.systolic} / ${log.diastolic} mmHg`
          : '-';

      return [
        `${formattedDate}${timeStr}`,
        bpStr,
        log.pulse ? `${log.pulse} bpm` : '-',
        log.notes || '-',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'BP (Sys/Dia)', 'Pulse', 'Notes']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [40, 116, 240] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  };

  // Render distinct non-overlapping sections
  renderSectionTable('Recent Readings (Past 7 Days)', grouped.weekly);
  renderSectionTable('Earlier This Month (8 to 30 Days Ago)', grouped.monthly);
  renderSectionTable('Older History (31 Days to 1 Year Ago)', grouped.yearly);

  // Save the generated document
  doc.save(`BP_Report_${patientName.replace(/\s+/g, '_')}.pdf`);
};