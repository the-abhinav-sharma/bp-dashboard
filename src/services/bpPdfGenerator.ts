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

// Helper: Safely parse dates to avoid UTC timezone shifts
const parseDate = (d: string | Date): Date => {
  if (d instanceof Date) return d;
  if (typeof d === 'string' && d.includes('T')) return new Date(d);
  return new Date(String(d).replace(/-/g, '/'));
};

export const generateBpPdf = (
  logs: BpLog[],
  patientName: string = 'Patient',
  chartBase64Image?: string
) => {
  if (!logs || logs.length === 0) {
    alert('No logs available to generate PDF.');
    return;
  }

  // 1. Sort ALL logs descending (Newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => parseDate(b.readingDate).getTime() - parseDate(a.readingDate).getTime()
  );

  const firstLog = sortedLogs[0];
  if (!firstLog) return;

  // Determine date bounds based on the latest record in the dataset
  const latestDate = parseDate(firstLog.readingDate);

  // 2. Compute cutoffs relative to the newest record
  const weeklyCutoff = new Date(latestDate);
  weeklyCutoff.setDate(latestDate.getDate() - 7);

  const monthlyCutoff = new Date(latestDate);
  monthlyCutoff.setDate(latestDate.getDate() - 30);

  const yearlyCutoff = new Date(latestDate);
  yearlyCutoff.setDate(latestDate.getDate() - 365);

  // 3. Filter into cumulative subsets
  const weeklyLogs = sortedLogs.filter((l) => parseDate(l.readingDate) >= weeklyCutoff);
  const monthlyLogs = sortedLogs.filter((l) => parseDate(l.readingDate) >= monthlyCutoff);
  const yearlyLogs = sortedLogs.filter((l) => parseDate(l.readingDate) >= yearlyCutoff);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let currentY = 15;

  // Document Title Header
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138); // Deep primary blue
  doc.text('Blood Pressure Clinical Summary Report', 14, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Patient: ${patientName} | Total Records: ${logs.length} | Generated: ${new Date().toLocaleDateString()}`,
    14,
    currentY
  );
  currentY += 10;

  // Render Visual Chart if available
if (chartBase64Image) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Blood Pressure Trends & Analysis Chart', 14, currentY);
    currentY += 4;

    // Use 'JPEG' and pass compression alias 'FAST' to keep file size tiny
    doc.addImage(
      chartBase64Image, 
      'JPEG', 
      14, 
      currentY, 
      180, 
      70, 
      undefined, 
      'FAST'
    );
    currentY += 76;
  }

  // Section Table Renderer
  const renderTableSection = (title: string, dataSubset: BpLog[]) => {
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`${title} (${dataSubset.length} entries)`, 14, currentY);
    currentY += 4;

    if (dataSubset.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('No entries recorded in this timeframe.', 14, currentY + 4);
      currentY += 12;
      return;
    }

    const tableRows = dataSubset.map((log) => {
      const dateStr = parseDate(log.readingDate).toLocaleDateString();
      const timeStr = log.timeOfDay ? ` (${log.timeOfDay})` : '';
      const bpStr =
        log.systolic && log.diastolic
          ? `${log.systolic} / ${log.diastolic} mmHg`
          : '-';

      return [
        `${dateStr}${timeStr}`,
        bpStr,
        log.pulse ? `${log.pulse} bpm` : '-',
        log.notes || '-',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'BP (Systolic/Diastolic)', 'Pulse', 'Notes']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  };

  // Render Sections
  renderTableSection('Past 7 Days (Weekly)', weeklyLogs);
  renderTableSection('Past 30 Days (Monthly)', monthlyLogs);
  renderTableSection('Past 1 Year (Yearly)', yearlyLogs);

  doc.save(`BP_Report_${patientName.replace(/\s+/g, '_')}.pdf`);
};