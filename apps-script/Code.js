/**
 * Load the "Assignments" sheet and return structured data.
 *
 * The sheet has columns: student_id, name, email, period, workshop, location
 * (one row per student-period assignment).
 *
 * Returns:
 *   students: Map of student_id -> { name, email, periods: [{period, workshop, location}] }
 *   byWorkshop: Map of "workshop|location|period" -> { workshop, period, location, students: [{student_id, name}, ...] }
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
      byWorkshop[key] = { workshop, period, location, students: [] };
    }
    byWorkshop[key].students.push({ student_id, name });
  });

  // Sort each student's periods
  Object.values(students).forEach(s => s.periods.sort((a, b) => a.period - b.period));

  // Sort students within each workshop by name
  Object.values(byWorkshop).forEach(w => w.students.sort((a, b) => a.name.localeCompare(b.name)));

  return { students, byWorkshop };
};

/**
 * Create a new Google Doc in the output folder. If templateId is provided,
 * copy that doc; otherwise create a blank one.
 */
const createDoc = (name, templateId) => {
  const folder = DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID);
  if (templateId) {
    const copy = DriveApp.getFileById(templateId).makeCopy(name, folder);
    const doc = DocumentApp.openById(copy.getId());
    doc.getBody().clear();
    return doc;
  }
  const doc = DocumentApp.create(name);
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  return doc;
};

/**
 * Create a new Google Spreadsheet in the output folder and return it.
 */
const createSpreadsheet = (name) => {
  const ss = SpreadsheetApp.create(name);
  DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID));
  return ss;
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

  let doc = createDoc(docName, CONFIG.SCHEDULES_TEMPLATE_ID);
  let docId = doc.getId();
  let body = doc.getBody();

  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("Generated on: " + ts).setItalic(true);
  body.appendPageBreak();

  // Sort students by name
  const sorted = Object.entries(students)
    .map(([student_id, s]) => ({ student_id, ...s }))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < sorted.length; i++) {
    const student = sorted[i];

    body.appendParagraph(`${student.name} (#${student.student_id})`)
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
      doc = DocumentApp.openById(docId);
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
  const docName = "Climate Workshop Attendance Sheets " + ts;

  let doc = createDoc(docName);
  let body = doc.getBody();

  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("Generated on: " + ts).setItalic(true);

  // Sort by workshop name then period
  const sorted = Object.values(byWorkshop).sort((a, b) =>
    a.workshop.localeCompare(b.workshop) || a.period - b.period
  );

  sorted.forEach(({ workshop, period, location, students }) => {
    body.appendPageBreak();
    const heading = location
      ? `${workshop} - P${period} [${location}]`
      : `${workshop} - P${period}`;
    body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING1);

    const tableData = [
      ['Name', 'P/T/A'],
      ...students.map(({ name, student_id }) => [`${name} (#${student_id})`, ''])
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
  const sheetName = "Climate Workshop Attendance Sheets " + ts;

  const targetSpreadsheet = createSpreadsheet(sheetName);

  // Set up info on the default sheet
  const infoSheet = targetSpreadsheet.getSheets()[0];
  infoSheet.setName("Info");
  infoSheet.getRange("A1").setValue(sheetName);
  infoSheet.getRange("A2").setValue("Generated on: " + ts);
  infoSheet.getRange("A1:A2").setFontWeight("bold");
  infoSheet.getRange("A2").setFontStyle("italic");

  // Sort by workshop name then period
  const sorted = Object.values(byWorkshop).sort((a, b) =>
    a.workshop.localeCompare(b.workshop) || a.period - b.period
  );

  sorted.forEach(({ workshop, period, location, students }) => {
    const loc = location ? ` [${location}]` : '';
    const tabName = `${workshop} - P${period}${loc}`.slice(0, 100);

    let sheet = targetSpreadsheet.insertSheet(tabName);

    // Header row
    sheet.getRange("A1:C1").setValues([['Student ID', 'Name', 'P/T/A']]);
    sheet.getRange("A1:C1").setFontWeight("bold");
    sheet.getRange("A1:C1").setBackground("#f3f3f3");

    // Student data
    if (students.length > 0) {
      const dataRange = sheet.getRange(2, 1, students.length, 3);
      const dataValues = students.map(({ student_id, name }) => [student_id, name, '']);
      dataRange.setValues(dataValues);
    }

    // Formatting
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 250);
    sheet.setColumnWidth(3, 100);

    const fullRange = sheet.getRange(1, 1, students.length + 1, 3);
    fullRange.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);

    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 3);
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
