-- Generated with pugilify v0.0.25.

-- choices -------------------------------------------------

-- :name choices :all
select * from choices;

-- :name insertChoice :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);

-- :name makeChoice :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);

-- :name makeChoiceWithDefaultValues :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);


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
insert into not_participating (course, hive) values ($course, $hive);

-- :name makeNotParticipating :insert
insert into not_participating (course, hive) values ($course, $hive);

-- :name makeNotParticipatingWithDefaultValues :insert
insert into not_participating (course, hive) values ($course, $hive);


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


-- raw_classes ---------------------------------------------

-- :name rawClasses :all
select * from raw_classes;

-- :name insertRawClass :insert
insert into raw_classes
  (student_id, course, teacher, period, section_id, start_date, end_date)
values
  ($studentId, $course, $teacher, $period, $sectionId, $startDate, $endDate);

-- :name makeRawClass :insert
insert into raw_classes
  (student_id, course, teacher, period, section_id, start_date, end_date)
values
  ($studentId, $course, $teacher, $period, $sectionId, $startDate, $endDate);

-- :name makeRawClassWithDefaultValues :insert
insert into raw_classes
  (student_id, course, teacher, period, section_id, start_date, end_date)
values
  ($studentId, $course, $teacher, $period, $sectionId, $startDate, $endDate);


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
  (student_id, name, email, grade, gender, iep, slc, active, first_name, last_name)
values
  ($studentId, $name, $email, $grade, $gender, $iep, $slc, $active, $firstName, $lastName);

-- :name makeRawStudent :insert
insert into raw_students
  (student_id, name, email, grade, gender, iep, slc, active, first_name, last_name)
values
  ($studentId, $name, $email, $grade, $gender, $iep, $slc, $active, $firstName, $lastName);

-- :name makeRawStudentWithDefaultValues :insert
insert into raw_students
  (student_id, name, email, grade, gender, iep, slc, active, first_name, last_name)
values
  ($studentId, $name, $email, $grade, $gender, $iep, $slc, $active, $firstName, $lastName);


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
  (student_id, email, first_name, last_name, hive)
values
  ($studentId, $email, $firstName, $lastName, $hive);

-- :name makeStudent :insert
insert into students
  (student_id, email, first_name, last_name, hive)
values
  ($studentId, $email, $firstName, $lastName, $hive);

-- :name makeStudentWithDefaultValues :insert
insert into students
  (student_id, email, first_name, last_name, hive)
values
  ($studentId, $email, $firstName, $lastName, $hive);


-- workshops -----------------------------------------------

-- :name workshops :all
select * from workshops;

-- :name insertWorkshop :insert
insert into workshops
  (workshop_id, workshop, period, duration, minimum, maximum, ideal)
values
  ($workshopId, $workshop, $period, $duration, $minimum, $maximum, $ideal);

-- :name workshop :get
select * from workshops where workshop_id = $workshopId;

-- :name updateWorkshop :run
update workshops set
  (workshop, period, duration, minimum, maximum, ideal) =
  ($workshop, $period, $duration, $minimum, $maximum, $ideal)
where
  workshop_id = $workshopId

-- :name makeWorkshop :insert
insert into workshops
  (workshop, period, duration, minimum, maximum, ideal)
values
  ($workshop, $period, $duration, $minimum, $maximum, $ideal);

-- :name makeWorkshopWithDefaultValues :insert
insert into workshops
  (workshop, period, duration, minimum, maximum, ideal)
values
  ($workshop, $period, $duration, $minimum, $maximum, $ideal);


