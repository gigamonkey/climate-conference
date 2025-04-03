-- :name possibilities :all
select email, period, duration, workshop from all_choices;

-- :name periods :all
select email, period from student_periods join students using (student_id);

-- :name workshopNames :list
select workshop from workshops where duration = 1;

-- :name extraNeeded :all
select student_id, 10 - count(*) extra from choices group by student_id having count(*) < 10;

-- :name limits :all
select distinct workshop, minimum, ideal, maximum from workshops;

-- :name toSchedule :list
select distinct student_id studentId from student_periods;
