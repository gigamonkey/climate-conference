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

# Run the genetic algorithm
./run.js -p 1000 -g 500
```

Results are written to `$DATA_DIR/runs/<timestamp>/` as JSON files, one per
generation.

## How It Works

1. **Data loading** (`make all`): Imports student rosters, class schedules,
   workshop definitions, and preference submissions from CSVs into a SQLite
   database.

2. **Optimization** (`run.js`): A genetic algorithm searches for assignments
   that keep every workshop close to its ideal enrollment. Each organism in
   the population is a complete assignment of all students to workshops. The
   optimizer fills each student's schedule from their submitted choices when
   possible, falling back to any available single-period workshop when a
   student's choices can't cover all their periods. See [Genetic Algorithm
   Details](#genetic-algorithm-details) below for a full description.

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

## Genetic Algorithm Details

The optimizer uses a genetic algorithm (GA) to search for an assignment of
students to workshops that keeps every workshop close to its ideal enrollment.
The GA framework (`ga.js`) is generic; the workshop-specific logic lives in
`workshop-assignment.js`.

### Genetic Encoding

Each **organism** in the population is a complete assignment of every student
to workshops. The organism's DNA is an array of **genes**, one per student.
Each gene is an object:

```
{
  student_id: "12345",
  periods: { 1: 42, 2: 17, 3: 42, 5: 8, 6: 31 }
}
```

The `periods` object maps period numbers to `workshop_id` values. A
multi-period workshop appears in multiple period slots with the same id (e.g.
workshop 42 in periods 1 and 3 above would be a duration-2 workshop spanning
periods 1-2... actually it spans whatever its definition says; the same id
repeats for each period it occupies). Not every period 1-6 is present — only
the periods where the student has a core class and is available for workshops
(from `student_periods`).

Workshop instances are identified by `workshop_id` (an integer primary key in
the `workshops` table), not by name. This matters because the same workshop
name can have multiple instances in different periods or locations, each with
its own capacity limits. The optimizer treats them as separate for enrollment
counting but as the same for student dedup (a student can't be assigned to
two instances of the same-named workshop).

### Initial Population

The initial population is created by `randomDNA()`, which calls
`randomAssignment()` for each student. This uses `randomlyFillPeriods()`, a
recursive backtracking algorithm:

1. Start with an empty assignment and a shuffled list of the student's usable
   choices (from `all_choices`, filtered by `usableChoice()`).
2. Try assigning the first choice. If it works, eliminate incompatible choices
   and recurse.
3. If assigning a choice leads to a dead end (some period can't be filled),
   backtrack and skip that choice.
4. Continue until all required periods are filled.

If the student's submitted choices can't cover all periods (common for students
who only selected multi-period field trips), the algorithm falls back to
single-period workshops from the `fallbacks` pool — one for each period that
still needs filling. This fallback happens automatically; the student's own
choices are always tried first.

#### Choice Filtering

A choice is **usable** (`usableChoice()`) if:

- Its periods don't overlap with already-assigned periods.
- The student doesn't already have a workshop with the same name assigned.
- The student doesn't already have a field trip assigned (if this choice is
  also a field trip).

Two choices are **incompatible** (`incompatible()`) if:

- They have the same workshop name, OR
- Their period ranges overlap, OR
- Both are field trips.

When a choice is assigned during backtracking, all incompatible choices are
eliminated from the remaining pool (`eliminate()`), which prunes the search
space.

### Generation Strategy

The active generation strategy (`nextGeneration()`) is an **elitist mutation**
approach — not a traditional crossover-based GA:

1. Find the fittest organism in the current population.
2. Create `populationSize - 1` new organisms by independently mutating copies
   of the best organism's DNA.
3. Keep one unmodified copy of the best organism (elitism).
4. Score fitness on all new organisms.

This means the population is always derived from a single parent. The
diversity comes entirely from mutation. Several alternative strategies are
implemented but not currently used (`nextGenerationOLD` with fitness-weighted
parent selection, `nextGenerationR` with alias-table weighted selection,
`nextGenerationHalf` with top-half truncation selection).

### Mutation

Each gene (student assignment) in the offspring has a chance of being mutated
(probability = `mutationRate`, default 0.005). The active mutation strategy
(`maybeMutate2()`) works as follows:

1. Pick a random workshop from the student's choice list that isn't already
   assigned to them. If no unassigned choices remain, skip the mutation.
2. Clear all periods that would conflict with the new workshop (including
   clearing the full span of any multi-period workshop that occupied those
   periods).
3. If the new workshop is a field trip, also clear any other assigned field
   trips.
4. Assign the new workshop.
5. Call `randomlyFillPeriods()` to fill any remaining empty periods, using the
   student's choices first and falling back to the general pool if needed.

This approach lets the optimizer explore multi-period workshop assignments
effectively (since the new choice can be multi-period, displacing whatever was
in those slots) while maintaining a valid assignment at every step.

An alternative mutation strategy (`maybeMutate()`) is simpler: pick a random
currently-assigned workshop, clear it, and refill all empty periods from
scratch. This is more disruptive but less targeted.

### Fitness Function

Fitness measures how close the overall assignment is to having every workshop
at its ideal enrollment. It works in three steps:

**1. Count enrollments** (`stats()`): For each workshop instance (identified
by `workshop_id`), count how many students are assigned to it. Each student is
counted once per workshop, regardless of how many periods the workshop spans.

**2. Score each workshop** (`scoreWorkshop()`): For each workshop instance,
compute a penalty score:

```
score = |assigned - ideal| / ideal
      + 5 * (if below minimum: |assigned - minimum| / ideal, else 0)
      + 5 * (if above maximum: |assigned - maximum| / ideal, else 0)
```

A workshop at its ideal gets a score of 0. Being away from ideal incurs a
linear penalty proportional to the distance, normalized by the ideal. Going
below the minimum or above the maximum incurs an additional 5x penalty.

**3. Combine scores** (`constraints()`): The overall fitness is:

```
fitness = 0.5 ^ variance(scores)
```

where `variance` is the sum of squared scores across all workshop instances.
This has several properties:

- A perfect assignment (all workshops at ideal, all scores = 0) gives
  fitness = 1.0.
- Any deviation reduces fitness exponentially.
- The variance formulation penalizes uneven distributions — it's better to
  have all workshops slightly off than to have most perfect and a few badly
  off.

### Convergence

The GA terminates after a fixed number of generations (the `-g` flag) or if
fitness reaches 1.0 (perfect assignment). In practice, perfect fitness is
rarely achieved because total enrollment demand may not exactly match total
ideal capacity. The optimizer converges toward the best achievable balance
given the constraints.

### Fallback Workshops and Choice Padding

Students who didn't submit enough preferences to cover all their periods (or
who only submitted multi-period choices that can't fill every slot) need
"fallback" workshops — single-period workshops they didn't choose, assigned to
fill the gaps.

The current approach pads each student's choice list in memory at startup
(`run.js`): for any period not covered by a submitted single-period choice,
all available single-period workshops for that period are added to the
student's choices. This gives the optimizer full control over those slots —
mutations can swap between fallback workshops just like submitted preferences.
Students whose submitted choices already cover all periods are unaffected and
will never be assigned a workshop they didn't choose. Use `show-fallbacks.js`
to see which students ended up with fallback assignments and what their
original choices were.

There is also a secondary fallback mechanism in `randomlyFillPeriods` that
adds fallback workshops during the backtracking fill if the student's choices
(including any padded fallbacks) can't cover all periods. With the in-memory
padding, this code path should never be reached in practice.

**TODO**: Once we've confirmed the in-memory padding approach works well
across multiple runs, remove the secondary fallback mechanism in
`randomlyFillPeriods` and the `fallbacks` parameter threading to simplify
the code.

## Configuration

Environment (set in `.env`, then `source .env`):

- **`DATA_DIR`**: Path to directory containing the input CSVs. The database
  and run outputs are also written here. Required by both `make` and `run.js`.
- **`NODE_OPTIONS`**: `--max_old_space_size=16384` (16 GB heap)

Key parameters in `run.js`:

- **Population size** and **generations**: passed as CLI arguments
- **Mutation rate**: `0.005` (hardcoded in `run.js`)
