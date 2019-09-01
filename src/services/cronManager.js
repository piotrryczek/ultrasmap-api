import cron from 'node-cron';

import { createSuggestionsSummary } from '@utilities/helpers';
import Backup from '@services/backup';

class CronManager {
  initBackups = async () => {
    cron.schedule('0 0 */6 * * *', () => { // Every six hours
      Backup.create();
    });
  }

  initSuggestionsSummary = async () => {
    cron.schedule('0 0 0 * * Tue,Thu,Sat', () => { // Every Tuesday, Thursday, Saturday
      createSuggestionsSummary();
    });
  }
}

export default new CronManager();
