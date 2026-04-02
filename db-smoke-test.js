#!/usr/bin/env node

import 'dotenv/config';
import { DB } from 'pugsql';

new DB(`${process.env.DATA_DIR}/db.db`).addQueries('pugly.sql').addQueries('queries.sql');
