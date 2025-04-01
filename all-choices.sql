drop view if exists all_choices;
create view all_choices as
with
  multiperiod as (select * from workshops where duration > 1),
  single_period as (select * from workshops where duration = 1)

select
  email,
  period,
  duration,
  workshop
from choices
join student_periods using (student_id)
join students using (student_id)
join single_period using (period, workshop)

union all

select
  email,
  period,
  duration,
  workshop
from choices
join students using (student_id)
join multiperiod using (workshop)

order by email, period, workshop;
