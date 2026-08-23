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

// Safely parse date strings or objects
const parseLogDate = (dateVal: string | Date): Date => {
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string' && dateVal.includes('T')) {
    return new Date(dateVal);
  }
  return new Date(String(dateVal).replace(/-/g, '/'));
};

// Group logs into cumulative timeframes (7 days, 30 days, 365 days)
const groupLogsByTimeframe = (logs: BpLog[]) => {
  const now = new Date();

  // Set cutoff boundaries at the absolute BEGINNING of the target day (00:00:00)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const oneYearAgo = new Date(now);
  oneYearAgo.setDate(now.getDate() - 365);
  oneYearAgo.setHours(0, 0, 0, 0);

  // Sort logs descending (newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => parseLogDate(b.readingDate).getTime() - parseLogDate(a.readingDate).getTime()
  );

  return {
    // All logs from the last 7 days
    weekly: sortedLogs.filter((l) => parseLogDate(l.readingDate) >= sevenDaysAgo),
    // All logs from the last 30 days (Includes Aug 12 - Aug 23)
    monthly: sortedLogs.filter((l) => parseLogDate(l.readingDate) >= thirtyDaysAgo),
    // All logs from the last 365 days (Includes Aug 12 - Aug 23)
    yearly: sortedLogs.filter((l) => parseLogDate(l.readingDate) >= oneYearAgo),
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

    doc.addImage(chartBase64Image, 'PNG', 14, currentY, 180, 75);
    currentY += 82;
  }

  // 2. Group Data
  const grouped = groupLogsByTimeframe(logs);

  const renderSectionTable = (title: string, data: BpLog[]) => {
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

  // Render cumulative sections
  renderSectionTable('Past 7 Days (Weekly)', grouped.weekly);
  renderSectionTable('Past 30 Days (Monthly)', grouped.monthly);
  renderSectionTable('Past 1 Year (Yearly)', grouped.yearly);

  doc.save(`BP_Report_${patientName.replace(/\s+/g, '_')}.pdf`);
};