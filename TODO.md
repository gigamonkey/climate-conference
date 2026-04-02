# TODO

## In progress

- Add to data validation script code to make sure all necessary input files exist. Script should say where each file comes from if it is missing.

## Backlog

## Done

- Move data out of project dir. (2026-04-02T07:59:41)

- Write data validation scripts to make sure form of csv matches database schema. Each `raw_` table in the schema should be loaded from a a csv of the same name (e.g. `raw_prefs` gets loaded from `raw_prefs.csv`) Make sure the number of columns match and provide a command line option to dump the column names from the csv and the schema columns paired. (2026-04-02T08:21:58)

