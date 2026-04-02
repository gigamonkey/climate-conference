.header on
.mode tabs

select
  workshop,
  period,
  count(*) num,
  group_concat(last_name || ', ' || first_name, '; ') participants
from assignments
join students using (email)
group by workshop, period
order by period, workshop;
