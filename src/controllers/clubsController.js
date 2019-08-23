import qs from 'qs';
import _cloneDeep from 'lodash/cloneDeep';
import _difference from 'lodash/difference';
import _pull from 'lodash/pull';

import {
  PER_PAGE,
  DEFAULT_COORDINATES,
} from '@config/config';
import {
  getRelationsToEdit,
  parseSearchQuery,
  singleClubDelete,
} from '@utilities/helpers';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';
import ImageUpload from '@services/imageUpload';

import Club from '@models/club';
import Activity from '@models/activity';

class ClubsController {
  getPaginated = async (ctx) => {
    const { query } = ctx;
    const {
      page = 1,
      search = '{}',
    } = query;

    const parsedSearch = parseSearchQuery(JSON.parse(search));

    const clubs = await Club.find(
      parsedSearch,
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    );

    const allCount = await Club.countDocuments(parsedSearch);

    ctx.body = {
      data: clubs,
      allCount,
    };
  }

  get = async (ctx) => {
    const { params } = ctx;
    const { clubId } = params;

    const club = await Club.findById(clubId)
      .populate('friendships')
      .populate('agreements')
      .populate('positives')
      .populate('satellites')
      .populate('satelliteOf');

    ctx.body = {
      data: club,
    };
  }

  add = async (ctx) => {
    const {
      user,
      req: {
        file,
        body,
      },
    } = ctx;

    const {
      name,
      tier,
      location,
      // Relations
      friendships: receivedFriendships = [],
      agreements: receivedAgreements = [],
      positives: receivedPositives = [],
      satellites: receivedSatellites = [],
      satelliteOf = null,
    } = body;

    const isClubWithName = await Club.findOne({ name });

    if (isClubWithName) throw new ApiError(errorCodes.ClubWithNameExists);

    const friendships = JSON.parse(receivedFriendships);
    const agreements = JSON.parse(receivedAgreements);
    const positives = JSON.parse(receivedPositives);
    const satellites = JSON.parse(receivedSatellites);

    const newClub = new Club({
      name,
      tier,
      location: {
        type: 'Point',
        coordinates: JSON.parse(location),
      },
      friendships,
      agreements,
      positives,
      satellites,
      satelliteOf,
    });

    if (!newClub.validateRelations()) throw new ApiError(errorCodes.RelationsNotUnique);
    await newClub.validate();

    if (file) {
      const logoUrl = await ImageUpload.upload(file);

      Object.assign(newClub, {
        logo: logoUrl,
      });
    }

    // Saving
    const { _id: newClubId } = await newClub.save();

    // Satellites
    if (satellites.length) {
      const criteria = {
        _id: { $in: satellites },
        satelliteOf: null,
      };

      const updatedSatellites = await Club.find(criteria);

      await Club.updateMany(
        criteria,
        {
          $set: {
            satelliteOf: newClubId,
          },
        },
      );

      if (satellites.length !== updatedSatellites.length) {
        Object.assign(newClub, {
          satellites: updatedSatellites,
        });

        await newClub.save();
      }
    }

    // Friendships
    if (friendships.length) {
      await Club.updateMany(
        {
          _id: { $in: friendships },
        },
        {
          $addToSet: {
            friendships: newClubId,
          },
        },
      );
    }

    // Agreements
    if (agreements.length) {
      await Club.updateMany(
        {
          _id: { $in: agreements },
        },
        {
          $addToSet: {
            agreements: newClubId,
          },
        },
      );
    }

    // Positives
    if (positives.length) {
      await Club.updateMany(
        {
          _id: { $in: positives },
        },
        {
          $addToSet: {
            positives: newClubId,
          },
        },
      );
    }

    // SatelliteOf
    if (satelliteOf) {
      await Club.updateOne(
        {
          _id: satelliteOf,
        },
        {
          $addToSet: {
            satellites: newClubId,
          },
        },
      );
    }

    // const activity = new Activity({
    //   user,
    //   originalObject: newClub,
    //   objectType: 'club',
    //   actionType: 'add',
    //   after: newClub,
    // });

    // await activity.save();

    ctx.body = {
      data: newClubId,
    };
  }

  update = async (ctx) => {
    const {
      user,
      params: {
        clubId,
      },
      req: {
        file,
        body,
      },
    } = ctx;

    const clubBeforeUpdate = await Club.findById(clubId);

    const {
      friendships: prevFriendships = [],
      agreements: prevAgreements = [],
      positives: prevPositives = [],
      satellites: prevSatellites = [],
      satelliteOf: prevSatelliteOf = null,
    } = clubBeforeUpdate;

    const {
      name,
      logo,
      tier,
      location,
      // Relations
      friendships: receivedFriendships = [],
      agreements: receivedAgreements = [],
      positives: receivedPositives = [],
      satellites: receivedSatellites = [],
      satelliteOf = null,
    } = body;

    const isClubWithName = await Club.findOne({ name });
    if (isClubWithName && clubBeforeUpdate.name !== name) throw new ApiError(errorCodes.ClubWithNameExists);

    const friendships = JSON.parse(receivedFriendships);
    const agreements = JSON.parse(receivedAgreements);
    const positives = JSON.parse(receivedPositives);
    const satellites = JSON.parse(receivedSatellites);

    const clubToBeUpdated = await Club.findById(clubId);
    const clubToBeUpdatedOriginal = _cloneDeep(clubToBeUpdated);

    Object.assign(clubToBeUpdated, {
      name,
      logo,
      tier,
      location: {
        type: 'Point',
        coordinates: JSON.parse(location),
      },
      friendships,
      agreements,
      positives,
      satellites,
      satelliteOf,
    });

    if (!clubToBeUpdated.validateRelations()) throw new ApiError(errorCodes.RelationsNotUnique);
    await clubToBeUpdated.validate();

    if (file) {
      const logoUrl = await ImageUpload.upload(file);

      Object.assign(clubToBeUpdated, {
        logo: logoUrl,
      });
    }

    // Satellites
    const {
      toAdd: satellitesToAdd,
      toRemove: satellitesToRemove,
    } = getRelationsToEdit(prevSatellites, satellites);

    if (satellitesToAdd.length || satellitesToRemove.length) {
      let updatedSatellites = [];
      if (satellitesToAdd.length) {
        const criteria = {
          _id: { $in: satellitesToAdd },
          satelliteOf: null,
        };

        updatedSatellites = await Club.find(criteria);

        await Club.updateMany(
          criteria,
          {
            $set: {
              satelliteOf: clubId,
            },
          },
        );
      }

      // eslint-disable-next-line no-underscore-dangle
      const potentialChangeInSatellites = _difference(satellitesToAdd, updatedSatellites.map(satellite => satellite._id));
      const finalSatellites = _pull(satellites, potentialChangeInSatellites);

      Object.assign(clubToBeUpdated, {
        satellites: finalSatellites, // Cannot override
      });

      if (satellitesToRemove.length) {
        await Club.updateMany(
          {
            _id: { $in: satellitesToRemove },
          },
          {
            $set: {
              satelliteOf: clubId,
            },
          },
        );
      }
    }

    await clubToBeUpdated.save();

    // Friendships
    const {
      toAdd: friendshipsToAdd,
      toRemove: friendshipsToRemove,
    } = getRelationsToEdit(prevFriendships, friendships);

    if (friendshipsToAdd.length) {
      await Club.updateMany(
        {
          _id: { $in: friendshipsToAdd },
        },
        {
          $addToSet: {
            friendships: clubId,
          },
        },
      );
    }

    if (friendshipsToRemove.length) {
      await Club.updateMany(
        {
          _id: { $in: friendshipsToRemove },
        },
        {
          $pull: {
            friendships: clubId,
          },
        },
      );
    }

    // Agreements
    const {
      toAdd: agreementsToAdd,
      toRemove: agreementsToRemove,
    } = getRelationsToEdit(prevAgreements, agreements);

    if (agreementsToAdd.length) {
      await Club.updateMany(
        {
          _id: { $in: agreementsToAdd },
        },
        {
          $addToSet: {
            agreements: clubId,
          },
        },
      );
    }

    if (agreementsToRemove.length) {
      await Club.updateMany(
        {
          _id: { $in: agreementsToRemove },
        },
        {
          $pull: {
            agreements: clubId,
          },
        },
      );
    }

    // Positives
    const {
      toAdd: positivesToAdd,
      toRemove: positivesToRemove,
    } = getRelationsToEdit(prevPositives, positives);

    if (positivesToAdd.length) {
      await Club.updateMany(
        {
          _id: { $in: positivesToAdd },
        },
        {
          $addToSet: {
            positives: clubId,
          },
        },
      );
    }

    if (positivesToRemove.length) {
      await Club.updateMany(
        {
          _id: { $in: positivesToRemove },
        },
        {
          $pull: {
            positives: clubId,
          },
        },
      );
    }

    // SatelliteOf
    if (satelliteOf) { // adding satellite to satellites
      await Club.updateOne(
        {
          _id: satelliteOf,
        },
        {
          $addToSet: {
            satellites: clubId,
          },
        },
      );
    }

    if (prevSatelliteOf && prevSatelliteOf !== satelliteOf) { // removing
      await Club.updateOne(
        {
          _id: prevSatelliteOf,
        },
        {
          $pull: {
            satellites: clubId,
          },
        },
      );
    }

    const activity = new Activity({
      user,
      originalObject: clubToBeUpdated,
      objectType: 'club',
      actionType: 'update',
      before: clubToBeUpdatedOriginal,
      after: clubToBeUpdated,
    });

    await activity.save();

    ctx.body = {
      success: true,
    };
  }

  addByNames = async (ctx) => {
    const {
      user,
      request: {
        body,
      },
    } = ctx;

    const { clubNames } = body;

    const clubsToAdd = clubNames.map(clubName => ({
      name: clubName,
      location: {
        type: 'Point',
        coordinates: DEFAULT_COORDINATES,
      },
    }));

    const addedClubs = await Club.insertMany(clubsToAdd);

    // TODO: Activity

    ctx.body = {
      data: addedClubs,
      success: true,
    };
  }

  remove = async (ctx) => {
    const {
      user,
      params: {
        clubId,
      },
    } = ctx;

    await singleClubDelete(user, clubId);

    ctx.body = {
      success: true,
    };
  }

  bulkRemove = async (ctx) => {
    const {
      user,
      request: {
        body,
      },
    } = ctx;
    const { ids } = body;

    const removePromises = ids.map(clubId => new Promise(async (resolve, reject) => {
      try {
        await singleClubDelete(user, clubId);

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    }));

    await Promise.all(removePromises);

    ctx.body = {
      success: true,
      data: ids,
    };
  }

  getPossibleRelations = async (ctx) => {
    const { query } = ctx;
    const {
      searchName,
      excluded = [],
    } = qs.parse(query);

    const clubs = await Club.find(
      {
        _id: { $nin: excluded },
        name: new RegExp(searchName, 'i'),
      },
    );

    ctx.body = {
      data: clubs,
    };
  }
}

export default new ClubsController();
