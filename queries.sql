-- :name possibilities :all
select email, student_id, period, duration, workshop, workshop_id from all_choices;

-- :name periods :all
select email, student_id, period from student_periods join students using (student_id);

-- :name workshopNames :list
select workshop from workshops where duration = 1;

-- :name singlePeriodWorkshops :all
select distinct workshop, period from workshops where duration = 1;

-- :name studentPeriods :all
select student_id, period from student_periods;

-- :name studentInfo :all
select student_id, email, coalesce(alias, first_name) first_name, last_name, hive from students;

-- :name workshopsFromSpreadsheet :list
select distinct workshop from workshops;

-- :name workshopsFromForm :list
select distinct workshop from choices where submitted;

-- :name extraNeeded :all
select student_id, 10 - count(*) extra from choices group by student_id having count(*) < 10;

-- :name limits :all
select workshop_id, workshop, location, period, duration, minimum, ideal, maximum from workshops;

-- :name toSchedule :list
select distinct student_id studentId from student_periods;
