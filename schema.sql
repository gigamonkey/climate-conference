drop table if exists raw_prefs;
create table if not exists raw_prefs (
  timestamp TEXT,
  username TEXT,
  last_name TEXT,
  first_name TEXT,
  email TEXT,
  student_id TEXT,
  hive TEXT,
  workshops TEXT
);

drop table if exists raw_workshops;
create table if not exists raw_workshops (
  workshop TEXT,
  location TEXT,
  periods TEXT,
  minimum INTEGER,
  maximum INTEGER,
  ideal TEXT,
  errors TEXT
);

drop table if exists raw_students;
create table raw_students (
  student_id TEXT,
  first_name TEXT,
  last_name TEXT,
  alias TEXT,
  hive TEXT,
  email TEXT
);

drop table if exists students;
create table  students (
  student_id TEXT,
  first_name TEXT,
  last_name TEXT,
  alias TEXT,
  hive TEXT,
  email TEXT
);

drop table if exists classes;
create table classes (
  student_id TEXT,
  course TEXT,
  teacher_email TEXT,
  period integer,
  section_id TEXT,
  start_date TEXT,
  end_date TEXT
);

drop table if exists workshops;
create table workshops (
  workshop_id integer primary key,
  workshop text,
  location text,
  period integer,
  duration integer,
  minimum integer,
  maximum integer,
  ideal integer
);

drop table if exists prefs;
create table prefs(
  timestamp text,
  student_id text,
  email text,
  last_name text,
  first_name text,
  hive text,
  workshops text
);

drop table if exists choices;
create table choices(
  student_id text,
  workshop text,
  submitted integer
);

drop table if exists assignments;
create table assignments (
  student_id text,
  period integer,
  workshop text,
  location text
);

drop table if exists core_classes;
create table core_classes (course text);

drop table if exists not_participating;
create table not_participating (teacher_email TEXT);
