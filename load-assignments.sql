drop table if exists assignments;
create table assignments (email text, period integer, workshop text);

.mode tabs
.import '| ./dump-assignments.js $(./latest-run.sh )' assignments
