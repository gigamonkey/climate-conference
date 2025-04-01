-- :name choices :all
select * from choices;

-- :name insertChoice :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);

-- :name makeChoice :insert
insert into choices (student_id, workshop, submitted) values ($studentId, $workshop, $submitted);

-- :name classes :all
select * from classes;

-- :name insertClass :insert
insert into classes (person_id, student_id, last_name, first_name, middle_name, nickname, gender, grade, birthdate, course, period, room, teacher, course_section_active, section_id, start_date, end_date, additional_id, enrollment_id, other_id, end_year, terms) values ($personId, $studentId, $lastName, $firstName, $middleName, $nickname, $gender, $grade, $birthdate, $course, $period, $room, $teacher, $courseSectionActive, $sectionId, $startDate, $endDate, $additionalId, $enrollmentId, $otherId, $endYear, $terms);

-- :name makeClass :insert
insert into classes (person_id, student_id, last_name, first_name, middle_name, nickname, gender, grade, birthdate, course, period, room, teacher, course_section_active, section_id, start_date, end_date, additional_id, enrollment_id, other_id, end_year, terms) values ($personId, $studentId, $lastName, $firstName, $middleName, $nickname, $gender, $grade, $birthdate, $course, $period, $room, $teacher, $courseSectionActive, $sectionId, $startDate, $endDate, $additionalId, $enrollmentId, $otherId, $endYear, $terms);

-- :name coreClasses :all
select * from core_classes;

-- :name insertCoreClass :insert
insert into core_classes (course) values ($course);

-- :name makeCoreClass :insert
insert into core_classes (course) values ($course);

-- :name notParticipating :all
select * from not_participating;

-- :name insertNotParticipating :insert
insert into not_participating (course, hive) values ($course, $hive);

-- :name makeNotParticipating :insert
insert into not_participating (course, hive) values ($course, $hive);

-- :name prefs :all
select * from prefs;

-- :name insertPref :insert
insert into prefs (timestamp, student_id, email, last_name, first_name, hive, workshops) values ($timestamp, $studentId, $email, $lastName, $firstName, $hive, $workshops);

-- :name makePref :insert
insert into prefs (timestamp, student_id, email, last_name, first_name, hive, workshops) values ($timestamp, $studentId, $email, $lastName, $firstName, $hive, $workshops);

-- :name rawPrefs :all
select * from raw_prefs;

-- :name insertRawPref :insert
insert into raw_prefs (timestamp, username, total_score, last_name, last_name_score, last_name_feedback, first_name, first_name_score, first_name_feedback, email, email_score, email_feedback, student_id, student_id_score, student_id_feedback, hive, hive_score, hive_feedback, workshops, workshopsscore, workshops_feedback) values ($timestamp, $username, $totalScore, $lastName, $lastNameScore, $lastNameFeedback, $firstName, $firstNameScore, $firstNameFeedback, $email, $emailScore, $emailFeedback, $studentId, $studentIdScore, $studentIdFeedback, $hive, $hiveScore, $hiveFeedback, $workshops, $workshopsscore, $workshopsFeedback);

-- :name makeRawPref :insert
insert into raw_prefs (timestamp, username, total_score, last_name, last_name_score, last_name_feedback, first_name, first_name_score, first_name_feedback, email, email_score, email_feedback, student_id, student_id_score, student_id_feedback, hive, hive_score, hive_feedback, workshops, workshopsscore, workshops_feedback) values ($timestamp, $username, $totalScore, $lastName, $lastNameScore, $lastNameFeedback, $firstName, $firstNameScore, $firstNameFeedback, $email, $emailScore, $emailFeedback, $studentId, $studentIdScore, $studentIdFeedback, $hive, $hiveScore, $hiveFeedback, $workshops, $workshopsscore, $workshopsFeedback);

-- :name rawStudents :all
select * from raw_students;

-- :name insertRawStudent :insert
insert into raw_students (student_id, name, email, grade, gender, iep, slc, active, first_name, last_name) values ($studentId, $name, $email, $grade, $gender, $iep, $slc, $active, $firstName, $lastName);

-- :name makeRawStudent :insert
insert into raw_students (student_id, name, email, grade, gender, iep, slc, active, first_name, last_name) values ($studentId, $name, $email, $grade, $gender, $iep, $slc, $active, $firstName, $lastName);

-- :name students :all
select * from students;

-- :name insertStudent :insert
insert into students (student_id, email, first_name, last_name, hive) values ($studentId, $email, $firstName, $lastName, $hive);

-- :name makeStudent :insert
insert into students (student_id, email, first_name, last_name, hive) values ($studentId, $email, $firstName, $lastName, $hive);

-- :name workshops :all
select * from workshops;

-- :name insertWorkshop :insert
insert into workshops (workshop, period, duration, minimum, maximum, ideal) values ($workshop, $period, $duration, $minimum, $maximum, $ideal);

-- :name makeWorkshop :insert
insert into workshops (workshop, period, duration, minimum, maximum, ideal) values ($workshop, $period, $duration, $minimum, $maximum, $ideal);

