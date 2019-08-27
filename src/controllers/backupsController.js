/**
 * TODO:
 * - activities
 */

import fs from 'fs';

import EmailSender from '@services/emailSender';
import Activity from '@models/activity';
import Backup from '@services/backup';

class BackupsController {
  list = async (ctx) => {
    try {
      const fileNames = await fs.promises.readdir('backups');

      const files = fileNames.map((fileName) => {
        const { birthtime } = fs.statSync(`backups/${fileName}`);

        return {
          fileName,
          createdAt: birthtime,
        };
      });

      files.sort((fileA, fileB) => {
        const timestampA = new Date(fileA.createdAt).getTime();
        const timestampB = new Date(fileB.createdAt).getTime();

        return timestampB - timestampA;
      });

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

    await EmailSender.sendEmail({
      to: process.env.MAIN_EMAIL,
      subject: 'UltrasMap: Backup',
      html: 'Został utworzony nowy backup.',
      attachments: [{
        filename: fileName,
        path: `backups/${fileName}`,
      }],
    });

    // const activity = new Activity({
    //   user,
    //   originalObject: null,
    //   objectType: 'backup',
    //   actionType: 'create',
    //   before: null,
    //   after: null,
    //   metaData: {
    //     fileName,
    //   },
    // });

    // await activity.save();

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

    // const activity = new Activity({
    //   user,
    //   originalObject: null,
    //   objectType: 'backup',
    //   actionType: 'restore',
    //   before: null,
    //   after: null,
    //   metaData: {
    //     fileName,
    //   },
    // });

    // await activity.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new BackupsController();
