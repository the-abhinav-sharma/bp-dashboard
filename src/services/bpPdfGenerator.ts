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

// Group logs into Weekly, Monthly, and Yearly segments
const groupLogsByTimeframe = (logs: BpLog[]) => {
  const now = new Date();

  // Create isolated dates so mutations don't chain together
  const oneWeekAgo = new Date(now.getTime());
  oneWeekAgo.setDate(now.getDate() - 7);

  const oneMonthAgo = new Date(now.getTime());
  oneMonthAgo.setDate(now.getDate() - 30); // 30 days back

  const oneYearAgo = new Date(now.getTime());
  oneYearAgo.setDate(now.getDate() - 365); // 365 days back

  // Sort logs in descending order (newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
  );

  return {
    weekly: sortedLogs.filter((l) => new Date(l.readingDate) >= oneWeekAgo),
    monthly: sortedLogs.filter((l) => new Date(l.readingDate) >= oneMonthAgo),
    yearly: sortedLogs.filter((l) => new Date(l.readingDate) >= oneYearAgo),
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

  // 2. Group Data
  const grouped = groupLogsByTimeframe(logs);

  const renderSectionTable = (title: string, data: BpLog[]) => {
    // Add page if running out of room
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
      doc.setTextColor(150);
      doc.text('No readings recorded for this period.', 14, currentY + 4);
      currentY += 12;
      return;
    }

    const tableRows = data.map((log) => [
  `${new Date(log.readingDate).toLocaleDateString()} ${log.timeOfDay ? `(${log.timeOfDay})` : ''}`,
  log.systolic && log.diastolic ? `${log.systolic} / ${log.diastolic} mmHg` : '-',
  log.pulse ? `${log.pulse} bpm` : '-',
  log.notes || '-',
]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'BP (Sys/Dia)', 'Pulse', 'Notes']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [40, 116, 240] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    // Update Y position for the next table
    currentY = (doc as any).lastAutoTable.finalY + 10;
  };

  // Render separate grouped tables
  renderSectionTable('Past 7 Days (Weekly)', grouped.weekly);
  renderSectionTable('Past 30 Days (Monthly)', grouped.monthly);
  renderSectionTable('Past 1 Year (Yearly)', grouped.yearly);

  // Save the generated document
  doc.save(`BP_Report_${patientName.replace(/\s+/g, '_')}.pdf`);
};