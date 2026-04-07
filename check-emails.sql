-- Find emails in raw prefs that don't match any record from IC. Need to add
-- ad-hoc fixes for these in load.sql

with missing as (select lower(p.email) email from raw_prefs p left join students s on lower(p.email) = lower(s.email) where s.email is null)
select m.email, hive from missing m join raw_students s on lower(s.email) = m.email;
