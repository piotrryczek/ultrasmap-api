/**
 * TODO:
 * - activities
 */

import fs from 'fs';

import Backup from '@services/backup';

class BackupsController {
  list = async (ctx) => {
    try {
      const files = await fs.promises.readdir('backups');

      ctx.body = {
        data: files,
      };
    } catch (error) {
      console.log(error);
    }
  }

  create = async (ctx) => {
    const fileName = await Backup.create();

    ctx.body = {
      data: fileName,
    };
  };

  restore = async (ctx) => {
    const { body } = ctx.request;
    const { fileName } = body;
    
    await Backup.restore(fileName);

    ctx.body = {
      success: true,
    };
  }
}

export default new BackupsController();
