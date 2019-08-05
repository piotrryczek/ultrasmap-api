import BackupController from '@controllers/backupController';

class BackupCron {
  init = () => {
    BackupController.create();
  }
}

export default new BackupCron();
