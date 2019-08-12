/**
 * TODO:
 * - cron every 12 hours
 */

import cron from 'node-cron';

import Backup from '@services/backup';
import { CRON_INTERVAL_HOURS } from '@config/config';

class BackupCron {
  init = async () => {
    cron.schedule(`* * */${CRON_INTERVAL_HOURS} * * *`, () => {
      Backup.create();
    });
  }
}

export default new BackupCron();
