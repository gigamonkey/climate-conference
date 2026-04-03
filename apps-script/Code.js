const STUDENT_SCHEDULES_DOC = '1eOm4ztEFctRXu2wYKygMSIYPreJiVe0G0NGBlCXV3SY';
const ATTENDANCE_DOC = '1SWXu_A62zCHuF4h2iJeHhFLu6fWx3ApdWu8y_k0q-78';
const ATTENDANCE_SPREADSHEET = '1q8hMHtpqaqY9XJT-OEvJfSj60PvCNdDZKzpJMU4J54I';

/**
 * Make a Google Doc with one page per student with their workshop schedule.
 */
const makeStudentSchedulesDoc = () => {

  const ts = new Date().toLocaleString();

  console.log("Starting " + ts);

  // Get the active spreadsheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("Assignments");

  let rooms = loadRooms(spreadsheet.getSheetByName("Rooms"));

  // Get data range (assuming your data has headers in the first row)
  var dataRange = sheet.getDataRange();
  var data = dataRange.getValues();

  let docName = spreadsheet.getName() + " - Per Student " + ts;
  let doc = DocumentApp.openById(STUDENT_SCHEDULES_DOC);
  //let doc = DocumentApp.create(docName);
  //STUDENT_SCHEDULES_DOC = doc.getId();
  //console.log(`Created doc ${STUDENT_SCHEDULES_DOC}`);

  let body = doc.getBody();
  body.clear();
  doc.saveAndClose();
  console.log('Cleared doc');

  doc = DocumentApp.openById(STUDENT_SCHEDULES_DOC);
  body = doc.getBody();

  // Add a title to the document
  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);

  body.appendParagraph("Generated on: " + ts).setItalic(true);

  body.appendPageBreak();

  // Add data as a table
  var headers = data[0];
  var studentData = data.slice(1); // Remove headers from data

  for (let i = 0; i < studentData.length; i++) {

    const [last, first, hive, ...periods] = studentData[i];
    body.appendParagraph(last + ", " + first + " (" + hive + ")")
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);

    const tableData = [];

    for (let p = 0; p < periods.length; p++) {
      if (periods[p]) {
        const workshop = periods[p];
        //body.appendParagraph(`Period ${p + 1}: ${workshop}. Room: ${rooms[workshop]}`);
        tableData.push([`${p + 1}`, workshop, rooms[workshop]]);
      }
    }
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

  let url = doc.getUrl();
  console.log('Document created successfully: ' + url);
  return url;
};

const loadRooms = (sheet) => {
  return Object.fromEntries(sheet.getDataRange().getValues().slice(1));
};

const loadAttendance = (sheet) => {
  return sheet.getDataRange().getValues().slice(1);
}

/**
 * Creates a menu item for the function.
 */
const onOpen = () => {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Tools')
    .addItem('Create student schedules', 'makeStudentSchedulesDoc')
    .addItem('Make attendance sheets doc', 'makeAttendanceDoc')
    .addItem('Make attendance spreadsheet', 'makeAttendanceSpreadsheet')
    .addToUi();
};

const emboldenRow = (table, rowIndex) => {
  let row = table.getRow(rowIndex);
  for (let i = 0; i < row.getNumCells(); i++) {
    row.getCell(i).setBold(true);
  }
};

/*
 * Make a Google Doc of printable attendance sheets.
 */
const makeAttendanceDoc = () => {

  const ts = new Date().toLocaleString();

  console.log("Starting " + ts);

  // Get the active spreadsheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let workshops = loadAttendance(spreadsheet.getSheetByName("By workshop"));

  let docId = ATTENDANCE_DOC;

  let doc = DocumentApp.openById(docId);
  const docName = "Climate Workshop Attendance Sheets";

  //let doc = DocumentApp.create(docName);
  //docId = doc.getId();
  //console.log(`Created doc ${docId}`);

  let body = doc.getBody();
  body.clear();
  doc.saveAndClose();
  console.log('Cleared doc');

  doc = DocumentApp.openById(docId);
  body = doc.getBody();

  // Add a title to the document
  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("Generated on: " + ts).setItalic(true);

  workshops.forEach(([workshop, period, num, names]) => {
    body.appendPageBreak();
    body.appendParagraph(workshop + " - P" + period).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    const tableData = [
      ['Name', 'P/T/A'],
      ...names.split('; ').map(n => n.trim()).filter(n => n.length > 0).sort().map(n => [n, ''])
    ];
    const table = body.appendTable(tableData);
    table.setBorderColor('#cccccc');
    emboldenRow(table, 0);
  });

  doc.saveAndClose();

  let url = doc.getUrl();
  console.log('Document created successfully: ' + url);
  return url;
};


/**
 * Make a Google Sheet with a tab per workshop for recording attendance.
 */
const makeAttendanceSpreadsheet = () => {
  const ts = new Date().toLocaleString();
  console.log("Starting " + ts);

  // Get the active spreadsheet
  var sourceSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let workshops = loadAttendance(sourceSpreadsheet.getSheetByName("By workshop"));

  // Create a new spreadsheet or use an existing one
  // Uncomment the following lines if you want to create a new spreadsheet each time
  // const newSpreadsheet = SpreadsheetApp.create("Climate Workshop Attendance Sheets");
  // const sheetId = newSpreadsheet.getId();
  // console.log(`Created sheet ${sheetId}`);
  //const targetSpreadsheet = newSpreadsheet;

  const targetSpreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET);

  // Delete all existing sheets except one (we'll use this as our info sheet)
  const sheets = targetSpreadsheet.getSheets();
  if (sheets.length > 0) {
    // Keep the first sheet for info
    const infoSheet = sheets[0];
    infoSheet.setName("Info");

    // Delete all other sheets
    for (let i = 1; i < sheets.length; i++) {
      targetSpreadsheet.deleteSheet(sheets[i]);
    }

    // Clear the info sheet
    infoSheet.clear();

    // Add title and timestamp to info sheet
    infoSheet.getRange("A1").setValue("Climate Workshop Attendance Sheets");
    infoSheet.getRange("A2").setValue("Generated on: " + ts);
    infoSheet.getRange("A1:A2").setFontWeight("bold");
    infoSheet.getRange("A2").setFontStyle("italic");
  }

  // Create a sheet for each workshop
  workshops.forEach(([workshop, period, num, names]) => {
    // Create a sanitized sheet name (sheets have limitations on name characters)
    const sheetName = `${workshop} - P${period}`.slice(0, 100);

    // Create a new sheet
    let sheet = targetSpreadsheet.insertSheet(sheetName);

    // Parse the names from the semicolon-separated string
    const namesList = names.split('; ')
                          .map(n => n.trim())
                          .filter(n => n.length > 0)
                          .sort();

    // Create the header row
    sheet.getRange("A1:B1").setValues([['Name', 'P/T/A']]);
    sheet.getRange("A1:B1").setFontWeight("bold");
    sheet.getRange("A1:B1").setBackground("#f3f3f3");

    // Add the names to the sheet
    if (namesList.length > 0) {
      const dataRange = sheet.getRange(2, 1, namesList.length, 2);
      const dataValues = namesList.map(name => [name, '']);
      dataRange.setValues(dataValues);
    }

    // Format the sheet
    sheet.setColumnWidth(1, 250); // Name column
    sheet.setColumnWidth(2, 100); // P/T/A column

    // Add borders to the table
    const fullRange = sheet.getRange(1, 1, namesList.length + 1, 2);
    fullRange.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);

    // Freeze the header row
    sheet.setFrozenRows(1);

    // Auto-resize columns to fit content
    sheet.autoResizeColumns(1, 2);
  });

  // Activate the first sheet (info sheet)
  targetSpreadsheet.setActiveSheet(targetSpreadsheet.getSheets()[0]);

  // Return the URL of the spreadsheet
  const url = targetSpreadsheet.getUrl();
  console.log('Spreadsheet created successfully: ' + url);
  return url;
};
