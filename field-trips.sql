.mode tabs
select student_id, last_name || ', ' || coalesce(alias, first_name) name, hive, workshop, group_concat(period) periods from assignments join students using (student_id) where workshop like 'Field trip%' group by student_id, workshop order by workshop, periods;
