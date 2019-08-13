/**
 * TODO:
 * - activities
 */

import fs from 'fs';

import Activity from '@models/activity';
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
    const { user } = ctx;
    const fileName = await Backup.create();

    const activity = new Activity({
      user,
      originalObject: null,
      objectType: 'backup',
      actionType: 'create',
      before: null,
      after: null,
      metaData: {
        fileName,
      },
    });

    await activity.save();

    ctx.body = {
      data: fileName,
    };
  };

  restore = async (ctx) => {
    const { request, user } = ctx;
    const {
      body: {
        fileName,
      },
    } = request;

    await Backup.restore(fileName);

    const activity = new Activity({
      user,
      originalObject: null,
      objectType: 'backup',
      actionType: 'restore',
      before: null,
      after: null,
      metaData: {
        fileName,
      },
    });

    await activity.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new BackupsController();
