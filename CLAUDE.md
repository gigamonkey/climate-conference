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

## Build and Run

```bash
# Build the database from CSV data
make all          # Creates db.db from schema.sql, load.sql, CSV files

# Run the genetic algorithm
./run.js db.db <population-size> <generations>
# e.g. ./run.js db.db 1000 500

# Reset
make clean        # Removes db.db and pugly.sql
```

Results go to `runs/<timestamp>/` as JSON files per generation.

## Key Files

- `run.js` — Entry point; loads data from DB, runs GA, writes results
- `ga.js` — Generic genetic algorithm framework
- `workshop-assignment.js` — Problem definition (fitness, mutation, crossover)
- `queries.sql` — PugSQL named queries (limits, periods, possibilities)
- `schema.sql` / `load.sql` — Database schema and data loading
- `load-workshops.js` — Loads workshop definitions from CSV into DB
- `pad-choices.js` — Fills student choices with random workshops for uncovered periods
- `show-assignments.js` — Display assignments as TSV
- `data/` — Input CSVs (student preferences, roster, schedules, workshops)

## Data Flow

CSV files → `make all` → SQLite DB → `run.js` (GA optimization) → JSON results
→ Google Sheets "Assignments" sheet → Apps Script generates docs

## Notes

- Memory intensive: uses `--max_old_space_size=16384` (16 GB heap)
- The `app-script/` subdirectory has its own `CLAUDE.md` with Apps Script details
- `school-assignment.js` is an older/alternate problem definition, not currently used
- No test suite
