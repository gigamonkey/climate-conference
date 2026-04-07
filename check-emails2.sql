-- Find emails in raw prefs that don't match any record from IC. Need to add
-- ad-hoc fixes for these in load.sql

select s.student_id, s.first_name, s.last_name, s.hive from raw_prefs p join students s on lower(p.email) = lower(s.email) where s.hive not like 'Hive%' order by s.hive, s.student_id;
