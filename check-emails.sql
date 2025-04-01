-- Find emails in raw prefs that don't match any record from IC. Need to add
-- ad-hoc fixes for these in load.sql

select email from raw_prefs left join students using (email) where students.email is null;
