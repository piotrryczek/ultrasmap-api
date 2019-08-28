/**
 * TODO:
 * - reseting password
 * - removing files while deleting club
 */

import '@config/env';
import backupCron from '@services/backupCron';
import app from './app';

app.listen(5000, () => {
  backupCron.init();
});
