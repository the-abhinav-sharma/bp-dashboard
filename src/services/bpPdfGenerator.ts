// utils/bpPdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Notice the 'type' keyword added below
import type { BpReading, TimeOfDay } from '@/types/bp';

// Helper to format TimeOfDay enum to readable text
const formatTimeOfDay = (timeOfDay: TimeOfDay): string => {
  switch (timeOfDay) {
    case 'MORNING':
      return 'Morning';
    case 'AFTERNOON':
      return 'Afternoon';
    case 'EVENING':
      return 'Evening';
    default:
      return timeOfDay;
  }
};

// Helper for clinical classification
const getClinicalCategory = (sys: number | null, dia: number | null): string => {
  if (sys === null || dia === null) return 'Incomplete';
  if (sys >= 180 || dia >= 120) return 'Critically High';
  if (sys >= 140 || dia >= 90) return 'Stage 2 High';
  if (sys >= 130 || dia >= 80) return 'Stage 1 High';
  if (sys >= 120 && dia < 80) return 'Slightly High';
  return 'Normal';
};

export const generateBpPdf = (
  readings: BpReading[],
  patientName: string = 'Patient'
): void => {
  if (readings.length === 0) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Filter out null values for valid statistical averages
  const validSys = readings.filter((r): r is BpReading & { systolic: number } => r.systolic !== null);
  const validDia = readings.filter((r): r is BpReading & { diastolic: number } => r.diastolic !== null);
  const validPulse = readings.filter((r): r is BpReading & { pulse: number } => r.pulse !== null);

  const avgSys = validSys.length > 0 
    ? Math.round(validSys.reduce((sum, r) => sum + r.systolic, 0) / validSys.length) 
    : '--';

  const avgDia = validDia.length > 0 
    ? Math.round(validDia.reduce((sum, r) => sum + r.diastolic, 0) / validDia.length) 
    : '--';

  const avgPulse = validPulse.length > 0 
    ? Math.round(validPulse.reduce((sum, r) => sum + r.pulse, 0) / validPulse.length) 
    : '--';

  // 1. Document Header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Blood Pressure Summary Report', 40, 50);

  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Patient: ${patientName}`, 40, 68);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 80);
  doc.text(`Total Readings: ${readings.length}`, 40, 92);

  // 2. Clinical Summary Box
  doc.setLineWidth(0.5);
  doc.setDrawColor(222, 226, 230);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(40, 105, 515, 55, 4, 4, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(33, 37, 41);
  doc.text(`Average BP: ${avgSys}/${avgDia} mmHg`, 55, 137);
  doc.text(`Average Pulse: ${avgPulse} bpm`, 300, 137);

  // 3. Detailed Data Table
  const tableRows: (string | number)[][] = readings.map((r) => {
    const bpDisplay = r.systolic !== null && r.diastolic !== null 
      ? `${r.systolic} / ${r.diastolic}` 
      : '--';
    const pulseDisplay = r.pulse !== null ? `${r.pulse} bpm` : '--';

    return [
      r.readingDate,
      formatTimeOfDay(r.timeOfDay),
      bpDisplay,
      pulseDisplay,
      getClinicalCategory(r.systolic, r.diastolic),
      r.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: 180,
    head: [['Date', 'Time of Day', 'BP (mmHg)', 'Pulse', 'Category', 'Notes']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 75 },
      2: { cellWidth: 75 },
      3: { cellWidth: 60 },
      4: { cellWidth: 90 },
      5: { cellWidth: 'auto' }
    }
  });

  // Save the PDF file
  const fileName = `BP_Report_${patientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};