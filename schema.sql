drop table if exists raw_prefs;
create table raw_prefs (
  timestamp,
  username,
  total_score,
  last_name,
  last_name_score,
  last_name_feedback,
  first_name,
  first_name_score,
  first_name_feedback,
  email,
  email_score,
  email_feedback,
  student_id,
  student_id_score,
  student_id_feedback,
  hive,
  hive_score,
  hive_feedback,
  workshops,
  workshopsscore,
  workshops_feedback
);


drop table if exists raw_students;
create table raw_students(
  student_id text,
  name text,
  email text,
  grade integer,
  gender text,
  iep text,
  slc text,
  active integer,
  first_name text,
  last_name text
);

drop table if exists workshops;
create table workshops (
  workshop text,
  period integer,
  duration integer,
  minimum integer,
  maximum integer,
  ideal integer
);

drop table if exists students;
create table students(
  student_id text,
  email text,
  first_name text,
  last_name text,
  hive text
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
create table choices(student_id text, workshop text, submitted integer);

drop table if exists classes;
create table classes (
  person_id TEXT,
  student_id TEXT,
  last_name TEXT,
  first_name TEXT,
  middle_name TEXT,
  nickname TEXT,
  gender TEXT,
  grade TEXT,
  birthdate TEXT,
  course TEXT,
  period integer,
  room TEXT,
  teacher TEXT,
  course_section_active TEXT,
  section_id TEXT,
  start_date TEXT,
  end_date TEXT,
  additional_id TEXT,
  enrollment_id TEXT,
  other_id TEXT,
  end_year TEXT,
  terms TEXT
);


drop table if exists core_classes;
create table core_classes (course text);

drop table if exists not_participating;
create table not_participating (course, hive);
