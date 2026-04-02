#!/usr/bin/env node

// Validate that email/student_id pairs in raw_prefs match raw_students.
// Must be run after the database is built (make all).

import 'dotenv/config';
import { DB } from 'pugsql';
import { Command } from 'commander';

const main = (database) => {
  const db = new DB(database);

  // Email matches but student_id in prefs is wrong
  const badIds = db.db.prepare(`
    select p.email, p.student_id as prefs_id, s.student_id as students_id
    from raw_prefs p
    join raw_students s on p.email = lower(s.email)
    where p.student_id != s.student_id
  `).all();

  // Student_id matches but emails differ
  const emailMismatch = db.db.prepare(`
    select p.student_id, p.email as prefs_email, lower(s.email) as students_email
    from raw_prefs p
    join raw_students s on p.student_id = s.student_id
    where p.email != lower(s.email)
  `).all();

  // Emails in prefs with no match in students
  const unknownStudents = db.db.prepare(`
    select distinct p.email
    from raw_prefs p
    left join raw_students s on p.email = lower(s.email)
    where s.email is null
  `).all();

  // Emails in students with no match in prefs
  const missingPrefs = db.db.prepare(`
    select distinct lower(s.email) as email
    from raw_students s
    left join raw_prefs p on lower(s.email) = p.email
    where p.email is null
  `).all();

  let ok = true;

  if (badIds.length > 0) {
    ok = false;
    console.log(`Bad student ids in prefs (${badIds.length}):`);
    badIds.forEach(({ email, prefs_id, students_id }) => {
      console.log(`  ${email}: prefs=${prefs_id}, students=${students_id}`);
    });
  }

  if (emailMismatch.length > 0) {
    ok = false;
    console.log(`Email mismatch (${emailMismatch.length}):`);
    emailMismatch.forEach(({ student_id, prefs_email, students_email }) => {
      console.log(`  ${student_id}: prefs=${prefs_email}, students=${students_email}`);
    });
  }

  if (unknownStudents.length > 0) {
    ok = false;
    console.log(`Unknown students (${unknownStudents.length}):`);
    unknownStudents.forEach(({ email }) => {
      console.log(`  ${email}`);
    });
  }

  if (missingPrefs.length > 0) {
    ok = false;
    console.log(`Missing prefs (${missingPrefs.length}):`);
    missingPrefs.forEach(({ email }) => {
      console.log(`  ${email}`);
    });
  }

  if (ok) {
    console.log('All email/student_id pairs match.');
  }
};

new Command()
  .name('validate-students')
  .description('Validate email/student_id pairs between raw_prefs and raw_students')
  .argument('[database]', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();
