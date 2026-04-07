-- Generated with pugilify v0.0.25.

-- assignments ---------------------------------------------

-- :name assignments :all
select * from assignments;

-- :name insertAssignment :insert
insert into assignments
  (student_id, period, workshop, location)
values
  ($studentId, $period, $workshop, $location);

-- :name makeAssignment :insert
insert into assignments
  (student_id, period, workshop, location)
values
  ($studentId, $period, $workshop, $location);

-- :name makeAssignmentWithDefaultValues :insert
insert into assignments
  (student_id, period, workshop, location)
values
  ($studentId, $period, $workshop, $location);


-- choices -------------------------------------------------

-- :name choices :all
select * from choices;

-- :name insertChoice :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);

-- :name makeChoice :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);

-- :name makeChoiceWithDefaultValues :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);


-- classes -------------------------------------------------

-- :name classes :all
select * from classes;

-- :name insertClass :insert
insert into classes
  (student_id, course, teacher_email, period, section_id, start_date, end_date)
values
  ($studentId, $course, $teacherEmail, $period, $sectionId, $startDate, $endDate);

-- :name makeClass :insert
insert into classes
  (student_id, course, teacher_email, period, section_id, start_date, end_date)
values
  ($studentId, $course, $teacherEmail, $period, $sectionId, $startDate, $endDate);

-- :name makeClassWithDefaultValues :insert
insert into classes
  (student_id, course, teacher_email, period, section_id, start_date, end_date)
values
  ($studentId, $course, $teacherEmail, $period, $sectionId, $startDate, $endDate);


-- core_classes --------------------------------------------

-- :name coreClasses :all
select * from core_classes;

-- :name insertCoreClass :insert
insert into core_classes (course) values ($course);

-- :name makeCoreClass :insert
insert into core_classes (course) values ($course);

-- :name makeCoreClassWithDefaultValues :insert
insert into core_classes (course) values ($course);


-- not_participating ---------------------------------------

-- :name notParticipating :all
select * from not_participating;

-- :name insertNotParticipating :insert
insert into not_participating (teacher_email) values ($teacherEmail);

-- :name makeNotParticipating :insert
insert into not_participating (teacher_email) values ($teacherEmail);

-- :name makeNotParticipatingWithDefaultValues :insert
insert into not_participating (teacher_email) values ($teacherEmail);


-- prefs ---------------------------------------------------

-- :name prefs :all
select * from prefs;

-- :name insertPref :insert
insert into prefs
  (timestamp, student_id, email, last_name, first_name, hive, workshops)
values
  ($timestamp, $studentId, $email, $lastName, $firstName, $hive, $workshops);

-- :name makePref :insert
insert into prefs
  (timestamp, student_id, email, last_name, first_name, hive, workshops)
values
  ($timestamp, $studentId, $email, $lastName, $firstName, $hive, $workshops);

-- :name makePrefWithDefaultValues :insert
insert into prefs
  (timestamp, student_id, email, last_name, first_name, hive, workshops)
values
  ($timestamp, $studentId, $email, $lastName, $firstName, $hive, $workshops);


-- raw_prefs -----------------------------------------------

-- :name rawPrefs :all
select * from raw_prefs;

-- :name insertRawPref :insert
insert into raw_prefs
  (timestamp, username, last_name, first_name, email, student_id, hive, workshops)
values
  ($timestamp, $username, $lastName, $firstName, $email, $studentId, $hive, $workshops);

-- :name makeRawPref :insert
insert into raw_prefs
  (timestamp, username, last_name, first_name, email, student_id, hive, workshops)
values
  ($timestamp, $username, $lastName, $firstName, $email, $studentId, $hive, $workshops);

-- :name makeRawPrefWithDefaultValues :insert
insert into raw_prefs
  (timestamp, username, last_name, first_name, email, student_id, hive, workshops)
values
  ($timestamp, $username, $lastName, $firstName, $email, $studentId, $hive, $workshops);


-- raw_students --------------------------------------------

-- :name rawStudents :all
select * from raw_students;

-- :name insertRawStudent :insert
insert into raw_students
  (student_id, first_name, last_name, alias, hive, email)
values
  ($studentId, $firstName, $lastName, $alias, $hive, $email);

-- :name makeRawStudent :insert
insert into raw_students
  (student_id, first_name, last_name, alias, hive, email)
values
  ($studentId, $firstName, $lastName, $alias, $hive, $email);

-- :name makeRawStudentWithDefaultValues :insert
insert into raw_students
  (student_id, first_name, last_name, alias, hive, email)
values
  ($studentId, $firstName, $lastName, $alias, $hive, $email);


-- raw_workshops -------------------------------------------

-- :name rawWorkshops :all
select * from raw_workshops;

-- :name insertRawWorkshop :insert
insert into raw_workshops
  (workshop, location, periods, minimum, maximum, ideal, errors)
values
  ($workshop, $location, $periods, $minimum, $maximum, $ideal, $errors);

-- :name makeRawWorkshop :insert
insert into raw_workshops
  (workshop, location, periods, minimum, maximum, ideal, errors)
values
  ($workshop, $location, $periods, $minimum, $maximum, $ideal, $errors);

-- :name makeRawWorkshopWithDefaultValues :insert
insert into raw_workshops
  (workshop, location, periods, minimum, maximum, ideal, errors)
values
  ($workshop, $location, $periods, $minimum, $maximum, $ideal, $errors);


-- students ------------------------------------------------

-- :name students :all
select * from students;

-- :name insertStudent :insert
insert into students
  (student_id, first_name, last_name, alias, hive, email)
values
  ($studentId, $firstName, $lastName, $alias, $hive, $email);

-- :name makeStudent :insert
insert into students
  (student_id, first_name, last_name, alias, hive, email)
values
  ($studentId, $firstName, $lastName, $alias, $hive, $email);

-- :name makeStudentWithDefaultValues :insert
insert into students
  (student_id, first_name, last_name, alias, hive, email)
values
  ($studentId, $firstName, $lastName, $alias, $hive, $email);


-- workshops -----------------------------------------------

-- :name workshops :all
select * from workshops;

-- :name insertWorkshop :insert
insert into workshops
  (workshop_id, workshop, location, period, duration, minimum, maximum, ideal)
values
  ($workshopId, $workshop, $location, $period, $duration, $minimum, $maximum, $ideal);

-- :name workshop :get
select * from workshops where workshop_id = $workshopId;

-- :name updateWorkshop :run
update workshops set
  (workshop, location, period, duration, minimum, maximum, ideal) =
  ($workshop, $location, $period, $duration, $minimum, $maximum, $ideal)
where
  workshop_id = $workshopId

-- :name makeWorkshop :insert
insert into workshops
  (workshop, location, period, duration, minimum, maximum, ideal)
values
  ($workshop, $location, $period, $duration, $minimum, $maximum, $ideal);

-- :name makeWorkshopWithDefaultValues :insert
insert into workshops
  (workshop, location, period, duration, minimum, maximum, ideal)
values
  ($workshop, $location, $period, $duration, $minimum, $maximum, $ideal);


