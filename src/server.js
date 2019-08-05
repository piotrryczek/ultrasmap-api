/**
 * TODO:
 * - verification email
 * - reseting password
 */

import '@config/env';
import backupCron from '@services/backupCron';
import app from './app';

app.listen(3000, () => {
  backupCron.init();
});
