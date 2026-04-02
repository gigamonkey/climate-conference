-- :name possibilities :all
select email, period, duration, workshop, workshop_id from all_choices;

-- :name periods :all
select email, period from student_periods join students using (student_id);

-- :name workshopNames :list
select workshop from workshops where duration = 1;

-- :name singlePeriodWorkshops :all
select distinct workshop, period from workshops where duration = 1;

-- :name studentPeriods :all
select student_id, period from student_periods;

-- :name workshopsFromSpreadsheet :list
select distinct workshop from workshops;

-- :name workshopsFromForm :list
select distinct workshop from choices where submitted;

-- :name extraNeeded :all
select student_id, 10 - count(*) extra from choices group by student_id having count(*) < 10;

-- :name limits :all
select workshop_id, workshop, period, minimum, ideal, maximum from workshops;

-- :name toSchedule :list
select distinct student_id studentId from student_periods;
