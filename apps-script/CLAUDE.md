# CLAUDE.md

## Overview

Google Apps Script project for generating climate conference workshop
assignment documents and attendance sheets from spreadsheet data. The code
runs inside Google Sheets as a container-bound script.

## Project Management

This project is managed with [`@peterseibel/hug`](https://www.npmjs.com/package/@peterseibel/hug),
a wrapper around `@google/clasp`. Key commands:

```bash
hug push              # Push local files to Apps Script
hug pull              # Pull remote files (refuses if uncommitted changes; -f to override)
hug open              # Open in Apps Script editor
hug open --container  # Open the bound spreadsheet
hug deploy            # Push, create version, and update deployment
hug config set K=V    # Set config values (written to config.js)
```

## Code Structure

Single file: `Code.js`. No build step, no bundler, no runtime dependencies.
All code uses Google Apps Script APIs (`SpreadsheetApp`, `DocumentApp`).

Key functions:
- `createDocFromSheet()` — Generates per-student schedule docs from "Assignments" sheet
- `makeAttendanceSheets()` / `makeAttendanceSheets2()` — Generates attendance docs
- `makeAttendanceSheets3()` — Generates attendance as a Google Sheets spreadsheet
- `onOpen()` — Adds "Custom Tools" menu to the spreadsheet

## Important Details

- Doc/Sheet IDs are hardcoded at the top of `Code.js` (see FIXME comment)
- The script reads from named sheets: "Assignments", "Rooms", "For attendance", "By workshop"
- `.clasp.json` contains the Apps Script project ID — do not change without `hug fork`
