import fs from 'fs';

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
    const fileName = await Backup.create();

    ctx.body = {
      data: fileName,
    };
  };

  restore = async (ctx) => {
    const { request } = ctx;
    const {
      body: {
        fileName,
        collectionsToRestore = ['roles', 'users', 'clubs', 'suggestions'],
      },
    } = request;

    await Backup.restore(fileName, collectionsToRestore);

    ctx.body = {
      success: true,
    };
  }
}

export default new BackupsController();
