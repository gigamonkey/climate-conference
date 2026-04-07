# TODO

## In progress

## Backlog

- Clean up scripts. Some are no longer needed.

## Done

- Move data out of project dir. (2026-04-02T07:59:41)

- Write data validation scripts to make sure form of csv matches database schema. Each `raw_` table in the schema should be loaded from a a csv of the same name (e.g. `raw_prefs` gets loaded from `raw_prefs.csv`) Make sure the number of columns match and provide a command line option to dump the column names from the csv and the schema columns paired. (2026-04-02T08:21:58)

- Add to data validation script code to make sure all necessary input files exist. Script should say where each file comes from if it is missing. Use `inputs.json` to get the description of where inputs come from. (2026-04-02T09:06:41)

- Update load-workshops to load from the `raw_workshops` table which contains a `periods` column with a column delimited list of either individual periods, e.g. `1,2,3` or ranges for multiperiod workshops, e.g. `1-2,3-4`. (2026-04-02T09:25:16)

- Write script to try to match up workshop names from `raw_workshops` and `raw_prefs`. Show any that exist in one but not the other. (2026-04-02T10:10:35)

- Handle workshops with the same name but different locations. Students should not be assigned to two different workshops with the same name. (2026-04-02T13:09:22)

- Convert command line scripts to use commander. (2026-04-02T13:24:54)

- Write a script to validate that the email/student_ids pairs in `raw_prefs` match those in `raw_students`. (2026-04-02T15:32:20)

- Can you make a plan for instead of adding random workshops to students choices early on, instead filling in empty spots just before we compute fitness, filling in gaps in students' assignments with random unused workshop spots? (2026-04-02T20:09:36)

- Switch to using `student_id` as the key everywhere. (2026-04-02T20:37:28)

- Prefer nickname to first name. (2026-04-03T11:06:16)

- Add Hive to attendance sheets. (2026-04-07T06:57:14)

- Add "kids on field trips" report. Maybe just a sheet in the spreadsheet. (2026-04-07T06:57:21)

