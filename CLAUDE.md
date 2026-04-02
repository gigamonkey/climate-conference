# CLAUDE.md

## Overview

Workshop assignment optimizer for Berkeley High School's climate conference.
Uses a genetic algorithm to assign students to workshops based on preferences,
schedule availability, and capacity constraints. Results feed into a Google
Apps Script (in `app-script/`) that generates student schedules and attendance
sheets.

## Tech Stack

- Node.js (ES modules), SQLite3 (`better-sqlite3`), PugSQL for named queries
- Google Apps Script (in `app-script/`, managed with `hug` CLI)

## Data Directory

All student data lives outside the project directory. Set `DATA_DIR` to the
directory containing the CSVs. The database (`db.db`) and run outputs
(`runs/`) are also created there.

```bash
source .env       # Sets DATA_DIR and NODE_OPTIONS
```

## Build and Run

```bash
source .env

# Build the database from CSV data
make all          # Creates $DATA_DIR/db.db

# Run the genetic algorithm
./run.js $DATA_DIR/db.db <population-size> <generations>
# e.g. ./run.js $DATA_DIR/db.db 1000 500

# Reset
make clean        # Removes $DATA_DIR/db.db and generated files
```

Results go to `$DATA_DIR/runs/<timestamp>/` as JSON files per generation.

## Key Files

- `run.js` — Entry point; loads data from DB, runs GA, writes results
- `ga.js` — Generic genetic algorithm framework
- `workshop-assignment.js` — Problem definition (fitness, mutation, crossover)
- `queries.sql` — PugSQL named queries (limits, periods, possibilities)
- `schema.sql` / `load.sql.in` — Database schema and data loading template
- `load-workshops.js` — Loads workshop definitions from CSV into DB
- `pad-choices.js` — Fills student choices with random workshops for uncovered periods
- `show-assignments.js` — Display assignments as TSV
- `$DATA_DIR/` — Input CSVs (student preferences, roster, schedules, workshops)

## Data Flow

CSV files → `make all` → SQLite DB → `run.js` (GA optimization) → JSON results
→ Google Sheets "Assignments" sheet → Apps Script generates docs

## Notes

- Memory intensive: uses `--max_old_space_size=16384` (16 GB heap)
- The `app-script/` subdirectory has its own `CLAUDE.md` with Apps Script details
- `school-assignment.js` is an older/alternate problem definition, not currently used
- No test suite
