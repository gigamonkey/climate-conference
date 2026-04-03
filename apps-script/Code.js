const STUDENT_SCHEDULES_DOC = '1eOm4ztEFctRXu2wYKygMSIYPreJiVe0G0NGBlCXV3SY';
const ATTENDANCE_DOC = '1SWXu_A62zCHuF4h2iJeHhFLu6fWx3ApdWu8y_k0q-78';
const ATTENDANCE_SPREADSHEET = '1q8hMHtpqaqY9XJT-OEvJfSj60PvCNdDZKzpJMU4J54I';

/**
 * Load the "Assignments" sheet and return structured data.
 *
 * The sheet has columns: student_id, name, email, period, workshop, location
 * (one row per student-period assignment).
 *
 * Returns:
 *   students: Map of student_id -> { name, email, periods: [{period, workshop, location}] }
 *   byWorkshop: Map of "workshop|period" -> { workshop, period, location, names: [name, ...] }
 */
const loadAssignments = () => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Assignments");
  const rows = sheet.getDataRange().getValues().slice(1); // skip header

  const students = {};
  const byWorkshop = {};

  rows.forEach(([student_id, name, email, period, workshop, location]) => {
    if (!student_id) return;

    // Build per-student data
    if (!students[student_id]) {
      students[student_id] = { name, email, periods: [] };
    }
    students[student_id].periods.push({ period, workshop, location });

    // Build per-workshop data
    const key = `${workshop}|${location}|${period}`;
    if (!byWorkshop[key]) {
      byWorkshop[key] = { workshop, period, location, names: [] };
    }
    byWorkshop[key].names.push(name);
  });

  // Sort each student's periods
  Object.values(students).forEach(s => s.periods.sort((a, b) => a.period - b.period));

  // Sort names within each workshop
  Object.values(byWorkshop).forEach(w => w.names.sort());

  return { students, byWorkshop };
};

/**
 * Make a Google Doc with one page per student with their workshop schedule.
 */
const makeStudentSchedulesDoc = () => {
  const ts = new Date().toLocaleString();
  console.log("Starting " + ts);

  const { students } = loadAssignments();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const docName = spreadsheet.getName() + " - Per Student " + ts;

  let doc = DocumentApp.openById(STUDENT_SCHEDULES_DOC);
  let body = doc.getBody();
  body.clear();
  doc.saveAndClose();
  console.log('Cleared doc');

  doc = DocumentApp.openById(STUDENT_SCHEDULES_DOC);
  body = doc.getBody();

  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("Generated on: " + ts).setItalic(true);
  body.appendPageBreak();

  // Sort students by name
  const sorted = Object.values(students).sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < sorted.length; i++) {
    const student = sorted[i];

    body.appendParagraph(student.name)
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);

    const tableData = student.periods.map(({ period, workshop, location }) =>
      [`${period}`, workshop, location || '']
    );

    const table = body.appendTable(tableData);
    table.setColumnWidth(0, 50);
    table.setColumnWidth(1, 300);
    table.setBorderColor('#cccccc');

    const headerRow = table.insertTableRow(0);
    ["Period", "Workshop", "Location"].forEach(h => {
      headerRow.appendTableCell(h).setBold(true);
    });

    body.appendPageBreak();

    if (i % 50 === 0) {
      console.log(`Saving at ${i}`);
      doc.saveAndClose();
      doc = DocumentApp.openById(STUDENT_SCHEDULES_DOC);
      body = doc.getBody();
    }
  }

  doc.saveAndClose();
  const url = doc.getUrl();
  console.log('Document created successfully: ' + url);
  return url;
};

const emboldenRow = (table, rowIndex) => {
  let row = table.getRow(rowIndex);
  for (let i = 0; i < row.getNumCells(); i++) {
    row.getCell(i).setBold(true);
  }
};

/**
 * Make a Google Doc of printable attendance sheets.
 */
const makeAttendanceDoc = () => {
  const ts = new Date().toLocaleString();
  console.log("Starting " + ts);

  const { byWorkshop } = loadAssignments();

  let doc = DocumentApp.openById(ATTENDANCE_DOC);
  const docName = "Climate Workshop Attendance Sheets";

  let body = doc.getBody();
  body.clear();
  doc.saveAndClose();
  console.log('Cleared doc');

  doc = DocumentApp.openById(ATTENDANCE_DOC);
  body = doc.getBody();

  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("Generated on: " + ts).setItalic(true);

  // Sort by workshop name then period
  const sorted = Object.values(byWorkshop).sort((a, b) =>
    a.workshop.localeCompare(b.workshop) || a.period - b.period
  );

  sorted.forEach(({ workshop, period, location, names }) => {
    body.appendPageBreak();
    const heading = location
      ? `${workshop} - P${period} [${location}]`
      : `${workshop} - P${period}`;
    body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING1);

    const tableData = [
      ['Name', 'P/T/A'],
      ...names.map(n => [n, ''])
    ];
    const table = body.appendTable(tableData);
    table.setBorderColor('#cccccc');
    emboldenRow(table, 0);
  });

  doc.saveAndClose();
  const url = doc.getUrl();
  console.log('Document created successfully: ' + url);
  return url;
};

/**
 * Make a Google Sheet with a tab per workshop for recording attendance.
 */
const makeAttendanceSpreadsheet = () => {
  const ts = new Date().toLocaleString();
  console.log("Starting " + ts);

  const { byWorkshop } = loadAssignments();

  const targetSpreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET);

  // Delete all existing sheets except one (keep for info)
  const sheets = targetSpreadsheet.getSheets();
  if (sheets.length > 0) {
    const infoSheet = sheets[0];
    infoSheet.setName("Info");

    for (let i = 1; i < sheets.length; i++) {
      targetSpreadsheet.deleteSheet(sheets[i]);
    }

    infoSheet.clear();
    infoSheet.getRange("A1").setValue("Climate Workshop Attendance Sheets");
    infoSheet.getRange("A2").setValue("Generated on: " + ts);
    infoSheet.getRange("A1:A2").setFontWeight("bold");
    infoSheet.getRange("A2").setFontStyle("italic");
  }

  // Sort by workshop name then period
  const sorted = Object.values(byWorkshop).sort((a, b) =>
    a.workshop.localeCompare(b.workshop) || a.period - b.period
  );

  sorted.forEach(({ workshop, period, location, names }) => {
    const sheetName = `${workshop} - P${period}`.slice(0, 100);

    let sheet = targetSpreadsheet.insertSheet(sheetName);

    // Header row
    sheet.getRange("A1:B1").setValues([['Name', 'P/T/A']]);
    sheet.getRange("A1:B1").setFontWeight("bold");
    sheet.getRange("A1:B1").setBackground("#f3f3f3");

    // Student names
    if (names.length > 0) {
      const dataRange = sheet.getRange(2, 1, names.length, 2);
      const dataValues = names.map(name => [name, '']);
      dataRange.setValues(dataValues);
    }

    // Formatting
    sheet.setColumnWidth(1, 250);
    sheet.setColumnWidth(2, 100);

    const fullRange = sheet.getRange(1, 1, names.length + 1, 2);
    fullRange.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);

    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 2);
  });

  targetSpreadsheet.setActiveSheet(targetSpreadsheet.getSheets()[0]);

  const url = targetSpreadsheet.getUrl();
  console.log('Spreadsheet created successfully: ' + url);
  return url;
};

/**
 * Creates a menu item for the functions.
 */
const onOpen = () => {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Tools')
    .addItem('Create student schedules', 'makeStudentSchedulesDoc')
    .addItem('Make attendance sheets doc', 'makeAttendanceDoc')
    .addItem('Make attendance spreadsheet', 'makeAttendanceSpreadsheet')
    .addToUi();
};
