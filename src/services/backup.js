import fs from 'fs';
import moment from 'moment';

import EmailSender from '@services/emailSender';
import Club from '@models/club';
import User from '@models/user';
import Role from '@models/role';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class Backup {
  create = async () => {
    try {
      const users = await User.find({});
      const clubs = await Club.find({});
      const roles = await Role.find({});

      const finalJson = {
        clubs,
        users,
        roles,
      };

      const fileName = `${moment().format('YYYY-MM-DD HH-mm-ss')}.json`;

      await fs.promises.writeFile(`backups/${fileName}`, JSON.stringify(finalJson), 'utf8');

      await EmailSender.sendEmail({
        to: process.env.MAIN_EMAIL,
        subject: `UltrasMap: Backup (${process.env.ADMIN_URL})`,
        html: 'Został utworzony nowy backup.',
        attachments: [{
          filename: fileName,
          path: `backups/${fileName}`,
        }],
      });

      return fileName;
    } catch (error) {
      throw new ApiError(errorCodes.Internal, error);
    }
  };

  restore = async (fileName) => {
    try {
      const fileData = await fs.promises.readFile(`backups/${fileName}`, 'utf-8');

      const { users, clubs, roles } = JSON.parse(fileData);

      await Role.deleteMany({});
      await Role.insertMany(roles);

      await User.deleteMany({});
      await User.insertMany(users);

      await Club.deleteMany({});
      await Club.insertMany(clubs);
    } catch (error) {
      throw new ApiError(errorCodes.Internal, error);
    }
  }
}

export default new Backup();
