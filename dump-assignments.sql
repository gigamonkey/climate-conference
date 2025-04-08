.header on
.mode tabs

select
  student_id,
  last_name,
  first_name,
  hive,
  max(case when period = 1 then workshop else null end) p1,
  max(case when period = 2 then workshop else null end) p2,
  max(case when period = 3 then workshop else null end) p3,
  max(case when period = 4 then workshop else null end) p4,
  max(case when period = 5 then workshop else null end) p5,
  max(case when period = 6 then workshop else null end) p6
from assignments
join students using (email) group by email;
