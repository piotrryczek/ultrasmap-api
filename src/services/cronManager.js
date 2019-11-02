import cron from 'node-cron';

import { createSuggestionsSummary, downloadMatchesForAllLeagues } from '@utilities/helpers';
import Backup from '@services/backup';

class CronManager {
  initBackups = async () => {
    cron.schedule('0 0 0 * * *', () => { // Everyday midnight
      Backup.create();
    });
  }

  initSuggestionsSummary = async () => {
    cron.schedule('0 0 0 * * Tue,Thu,Sat', () => { // Every Tuesday, Thursday, Saturday
      createSuggestionsSummary();
    });
  }

  downloadMatches = async () => {
    cron.schedule('0 0 0 * * *', async () => { // Everyday midnight
      await downloadMatchesForAllLeagues();
    });
  }
}

export default new CronManager();
