/**
 * TODO:
 * - activities
 */

import Club from '@models/club';
import User from '@models/user';

class BackupController {
  create = async () => {
    const users = await User.find({});
    const clubs = await Club.find({});

    console.log(clubs);

  }

  restore = (backupFile) => {

  }
}

export default new BackupController();
