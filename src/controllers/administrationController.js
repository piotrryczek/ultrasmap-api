import { remove } from 'diacritics';

import Club from '@models/club';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class AdministrationController {
  generateSearchNames = async (ctx) => {
    const clubs = await Club.find({});

    const editPromises = clubs.reduce((acc, club) => {
      const { name, searchName } = club;

      const cleanedName = remove(name);

      if (name === cleanedName || (searchName && searchName.includes(cleanedName))) return acc;

      acc.push(new Promise(async (resolve, reject) => {
        try {
          Object.assign(club, {
            searchName: `${searchName || ''} ${cleanedName}`,
          });

          await club.save();

          resolve();
        } catch (error) {
          reject(new ApiError(errorCodes.Internal, error));
        }
      }));

      return acc;
    }, []);

    if (editPromises.length) await Promise.all(editPromises);

    ctx.body = {
      success: true,
      alteredNumber: editPromises.length,
    };
  }
}

export default new AdministrationController();
