with
  signups as (select period, workshop, count(*) signups from all_choices group by period, workshop),
  slots as (select period, workshop, ideal from workshops)
select
  *
from signups
join slots using (period, workshop);
