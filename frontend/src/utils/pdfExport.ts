import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GradeTable } from '../types';

export function exportToPDF(table: GradeTable) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 23, 20);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Notenübersicht der Klasse ${table.className}`, 12, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`SJ ${table.schoolYear}`, 12, 16);
  if (table.headTeacher) {
    doc.text(`Klassenvorstand: ${table.headTeacher}`, 12, 21);
  }
  doc.setTextColor(200, 75, 31);
  doc.setFontSize(9);
  doc.text('NotenPortal', pageWidth - 12, 10, { align: 'right' });

  // Table headers
  const headers: string[] = ['#', 'Familienname, Vorname', 'Fehlstd.', 'unentsch.', 'Betragen'];
  table.subjects.forEach(s => headers.push(s.shortName || s.name.substring(0, 6)));
  headers.push('Ø');

  const rows = table.students.map((student, idx) => {
    const gradeValues: (string | number)[] = [];
    table.subjects.forEach(s => {
      const g = student.grades[s.id];
      gradeValues.push(g !== null && g !== undefined ? String(g) : '–');
    });

    const numGrades = gradeValues
      .map(g => parseFloat(String(g)))
      .filter(g => !isNaN(g));
    const avg = numGrades.length > 0
      ? (numGrades.reduce((a, b) => a + b, 0) / numGrades.length).toFixed(2)
      : '–';

    return [
      String(idx + 1),
      `${student.lastName} ${student.firstName}`,
      student.absences.total || 0,
      student.absences.unexcused || 0,
      student.absences.behavior || '',
      ...gradeValues,
      avg,
    ];
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 26,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [26, 23, 20],
      textColor: [240, 236, 230],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 46, halign: 'left' },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 16 },
    },
    alternateRowStyles: { fillColor: [250, 248, 245] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 5 && data.column.index < headers.length - 1) {
        const val = parseFloat(String(data.cell.raw));
        if (!isNaN(val)) {
          if (val === 1) data.cell.styles.textColor = [45, 125, 70];
          else if (val === 2) data.cell.styles.textColor = [26, 95, 170];
          else if (val === 3) data.cell.styles.textColor = [192, 122, 0];
          else if (val === 4) data.cell.styles.textColor = [200, 75, 31];
          else if (val === 5) data.cell.styles.textColor = [192, 39, 26];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 8, right: 8 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Erstellt am ${new Date().toLocaleDateString('de-AT')} | NotenPortal | Seite ${i} / ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  const filename = `Noten_${table.className}_${table.schoolYear.replace('/', '-')}.pdf`;
  doc.save(filename);
}
