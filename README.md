# Climate Conference Workshop Assignment Optimizer

Assigns Berkeley High School freshmen to climate conference workshops using a
genetic algorithm. Students submit ranked workshop preferences via a Google
Form; this system optimizes assignments across six class periods subject to
schedule availability, workshop capacity, and preference satisfaction.

## Quick Start

```bash
npm install

# Set DATA_DIR to the directory containing the input CSVs.
# The database and run outputs will also be created there.
# Edit .env to set the path, then source it:
source .env

# Build the SQLite database from CSV data
make all

# Run the genetic algorithm (population size, generations)
./run.js $DATA_DIR/db.db 1000 500
```

Results are written to `$DATA_DIR/runs/<timestamp>/` as JSON files, one per
generation.

## How It Works

1. **Data loading** (`make all`): Imports student rosters, class schedules,
   workshop definitions, and preference submissions from CSVs into a SQLite
   database. Students who submitted fewer than 10 choices get padded with
   random workshops so the optimizer has enough options to fill their schedule.

2. **Optimization** (`run.js`): A genetic algorithm searches for assignments
   that keep every workshop close to its ideal enrollment. Each organism in the
   population is a complete assignment of all students to workshops. The current
   strategy mutates copies of the fittest organism each generation (no
   crossover between distinct parents). Mutation works by picking a random
   workshop from the student's choice list and swapping it in, clearing
   conflicting periods and randomly refilling gaps.

3. **Output**: The best assignment from the final generation is exported to a
   Google Sheet, where an Apps Script (`app-script/`) generates per-student
   schedule documents and workshop attendance sheets.

## Project Structure

```
run.js                  Entry point: loads data, runs GA, writes results
ga.js                   Generic genetic algorithm framework
workshop-assignment.js  Problem definition (fitness, mutation, constraints)
queries.sql             PugSQL named queries used by run.js
schema.sql              Database table definitions
load.sql.in             Data import template (CSV -> tables; Makefile generates load.sql)
load-workshops.js       Loads workshop CSVs into the workshops table
pad-choices.js          Pads student choices to 10 with random workshops
show-assignments.js     Display assignments as TSV
dump-assignments.js     Export assignments from DB as JSON
show-deltas.js          Compare two assignment versions
$DATA_DIR/              Input CSV files (outside project directory)
$DATA_DIR/runs/         Output directory (timestamped GA results)
$DATA_DIR/db.db         SQLite database (built by make)
app-script/             Google Apps Script for generating documents
```

## Database Schema

The database (`$DATA_DIR/db.db`) is built from scratch by `make all`. There are
no migrations; `make clean && make all` rebuilds everything.

### Tables

**`raw_prefs`** — Raw Google Form responses for workshop preference
submissions. Each row is one form submission with student identifying info and
a semicolon-delimited list of workshop names. Multiple submissions per student
are possible; only the most recent is used. Consumed by `load.sql` to populate
`prefs`.

**`raw_students`** — Raw student roster imported from the school's student
information system. Contains demographic and enrollment data (grade, gender,
IEP status, SLC/hive assignment). Filtered during load to only active 9th
graders. Consumed by `load.sql` to populate `students`.

**`students`** — Clean student table with just the fields the optimizer needs:
`student_id`, `email`, `first_name`, `last_name`, and `hive` (the small
learning community the student belongs to). Only includes students in a Hive
SLC.

**`prefs`** — Deduplicated preferences, one row per student. Built by joining
`raw_prefs` to `students` on email and keeping only the most recent submission
(by timestamp). The `workshops` column is the semicolon-delimited list of
chosen workshop names.

**`choices`** — Individual workshop choices, one row per student-workshop pair.
Produced by splitting the semicolon-delimited `workshops` string from `prefs`.
The `submitted` flag distinguishes student-submitted choices (1) from
randomly-padded ones (0) added by `pad-choices.js`.

**`workshops`** — Workshop definitions with one row per workshop-period
combination. A single-period workshop offered in periods 2 and 4 has two rows.
A multi-period workshop spanning periods 1-3 has one row with `period=1` and
`duration=3`. Columns: `workshop` (name), `period`, `duration`, `minimum`,
`maximum`, `ideal` (enrollment targets).

**`classes`** — Full class schedule for all students, imported from the school
information system. One row per student-course enrollment with period, room,
teacher, and date range. Used to determine which periods each student is
available for workshops.

**`core_classes`** — List of course names that count as "core" classes.
Students are pulled out of these classes to attend workshops, so the periods
where a student has a core class are the periods available for workshop
assignment.

**`not_participating`** — Exceptions: specific course/hive combinations where
students should *not* be pulled from class. For example, Hive 7 students are
not pulled from English or History, and Hive 2/4 students are not pulled from
Math.

### Views

**`student_periods`** — Joins `classes`, `core_classes`, `students`, and
`not_participating` to produce the list of periods each student is available
for workshops. This is the primary input to the optimizer.

**`all_choices`** — Joins `choices`, `student_periods`, and `workshops` to
produce every valid student-workshop-period combination. For single-period
workshops, a choice only appears for periods where both the workshop is offered
and the student is available. Multi-period workshops appear for every student
who chose them regardless of period (the optimizer handles period feasibility).

## Fitness Function

The optimizer's fitness function measures how close each workshop's enrollment
is to its ideal size. For each workshop-period combination, it computes a
penalty based on distance from ideal, with 5x penalties for going below the
minimum or above the maximum. The overall fitness is `0.5 ^ variance(scores)`
across all workshop-period assignments, so a perfect score of 1.0 means every
workshop hit its ideal enrollment exactly.

## Configuration

Environment (set in `.env`, then `source .env`):

- **`DATA_DIR`**: Path to directory containing the input CSVs. The database
  and run outputs are also written here. Required by both `make` and `run.js`.
- **`NODE_OPTIONS`**: `--max_old_space_size=16384` (16 GB heap)

Key parameters in `run.js`:

- **Population size** and **generations**: passed as CLI arguments
- **Mutation rate**: `0.005` (hardcoded in `run.js`)
