select
  student_id,
  email,
  students.last_name || ', ' || students.first_name name,
  hive,
  period,
  course,
  teacher_email
from students join raw_classes using (student_id) left join core_raw_classes using (course)
where
  classes.end_date = '' and
  core_raw_classes.course is null and
  raw_classes.course <> 'LEAP' and
  (hive in ('Hive 3', 'Hive 4', 'Hive 5', 'Hive 7') and period = 3 or hive in ('Hive 1', 'Hive 2', 'Hive 6') and period = 5)
order by hive, students.last_name;
