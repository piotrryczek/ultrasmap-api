import _cloneDeep from 'lodash/cloneDeep';
import _difference from 'lodash/difference';
import _pull from 'lodash/pull';
import _get from 'lodash/get';

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
import estimateClubsAttitude from '@utilities/estimation/estimateClubsAttitude';
import ImageUpload from '@services/imageUpload';

import Club from '@models/club';
import League from '@models/league';
import Activity from '@models/activity';

class ClubsController {
  getPaginated = async (ctx) => {
    const { queryParsed } = ctx;
    const {
      page = 1,
      search = {},
      excluded = [],
    } = queryParsed;

    const parsedSearch = parseSearchQuery(search);

    const searchName = _get(search, 'name.value', null);

    if (searchName) {
      const { name: nameRegExp } = parsedSearch;

      delete parsedSearch.name;

      Object.assign(parsedSearch, {
        _id: { $nin: excluded },
        $or: [
          { name: nameRegExp },
          { transliterationName: nameRegExp },
          { searchName: nameRegExp },
        ],
      });
    }

    const clubs = await Club.find(
      parsedSearch,
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    ).sort({ createdAt: 'descending' });

    if (searchName) {
      clubs.sort(a => (a.name.toLowerCase().startsWith(searchName) ? -1 : 1)); // TODO: rethink, it is sorting only results from DB, search results improved but far from best
    }

    const allCount = await Club.countDocuments(parsedSearch);

    ctx.body = {
      data: clubs,
      allCount,
    };
  }

  getAllByTier = async (ctx) => {
    const clubs = await Club.find({}).select('name transliterationName tier').sort({ tier: 'descending' });

    ctx.body = {
      data: clubs,
    };
  }

  getWithinArea = async (ctx) => {
    const { queryParsed } = ctx;
    const {
      northWest,
      southWest,
      northEast,
      southEast,
    } = queryParsed;

    const areaToSearch = {
      type: 'Polygon',
      coordinates: [[
        northWest,
        northEast,
        southEast,
        southWest,
        northWest,
      ]],
    };

    const clubs = await Club.find({}).where('location').within(areaToSearch);

    ctx.body = {
      data: clubs,
    };
  }

  getRandomClubId = async (ctx) => {
    const count = await Club.countDocuments();
    const random = Math.floor(Math.random() * count);

    const { _id: clubId } = await Club.findOne().skip(random);

    ctx.body = {
      data: clubId,
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
      .populate('enemies')
      .populate('derbyRivalries')
      .populate('satelliteOf')
      .populate('league');

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
      logo,
      transliterationName,
      searchName,
      tier = 3,
      location,
      // Relations
      friendships: receivedFriendships = [],
      agreements: receivedAgreements = [],
      positives: receivedPositives = [],
      satellites: receivedSatellites = [],
      enemies: receivedEnemies = [],
      derbyRivalries: receivedDerbyRivalries = [],
      satelliteOf = null,
    } = body;

    const isClubWithName = await Club.findOne({ name });

    if (isClubWithName) throw new ApiError(errorCodes.ClubWithNameExists);

    const friendships = JSON.parse(receivedFriendships);
    const agreements = JSON.parse(receivedAgreements);
    const positives = JSON.parse(receivedPositives);
    const satellites = JSON.parse(receivedSatellites);
    const enemies = JSON.parse(receivedEnemies);
    const derbyRivalries = JSON.parse(receivedDerbyRivalries);

    const newClub = new Club({
      name,
      logo, // via suggestion
      transliterationName,
      searchName,
      tier,
      location: {
        type: 'Point',
        coordinates: JSON.parse(location),
      },
      friendships,
      agreements,
      positives,
      satellites,
      enemies,
      derbyRivalries,
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

    // Enemies
    if (enemies.length) {
      await Club.updateMany(
        {
          _id: { $in: enemies },
        },
        {
          $addToSet: {
            enemies: newClubId,
          },
        },
      );
    }

    // derbyRivalries
    if (derbyRivalries.length) {
      await Club.updateMany(
        {
          _id: { $in: derbyRivalries },
        },
        {
          $addToSet: {
            derbyRivalries: newClubId,
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

    const activity = new Activity({
      user,
      originalObject: newClub,
      objectType: 'club',
      actionType: 'add',
      after: newClub,
    });

    await activity.save();

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
      enemies: prevEnemies = [],
      derbyRivalries: prevDerbyRivalries = [],
      satelliteOf: prevSatelliteOf = null,
    } = clubBeforeUpdate;

    const {
      name,
      transliterationName,
      searchName,
      logo,
      tier,
      location,
      // Relations
      friendships: receivedFriendships = [],
      agreements: receivedAgreements = [],
      positives: receivedPositives = [],
      satellites: receivedSatellites = [],
      enemies: receivedEnemies = [],
      derbyRivalries: receivedDerbyRivalries = [],
      satelliteOf = null,
    } = body;

    const isClubWithName = await Club.findOne({ name });
    if (isClubWithName && clubBeforeUpdate.name !== name) throw new ApiError(errorCodes.ClubWithNameExists);

    const friendships = JSON.parse(receivedFriendships);
    const agreements = JSON.parse(receivedAgreements);
    const positives = JSON.parse(receivedPositives);
    const enemies = JSON.parse(receivedEnemies);
    const derbyRivalries = JSON.parse(receivedDerbyRivalries);
    const satellites = JSON.parse(receivedSatellites);

    const clubToBeUpdated = await Club.findById(clubId);
    const clubToBeUpdatedOriginal = _cloneDeep(clubToBeUpdated);

    Object.assign(clubToBeUpdated, {
      name,
      logo,
      location: {
        type: 'Point',
        coordinates: JSON.parse(location),
      },
      friendships,
      agreements,
      positives,
      satellites,
      enemies,
      derbyRivalries,
      satelliteOf,
    });

    if (typeof transliterationName === 'string') Object.assign(clubToBeUpdated, { transliterationName });
    if (typeof searchName === 'string') Object.assign(clubToBeUpdated, { searchName });
    if (tier) Object.assign(clubToBeUpdated, { tier });

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
              satelliteOf: null,
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

    // Enemies
    const {
      toAdd: enemiesToAdd,
      toRemove: enemiesToRemove,
    } = getRelationsToEdit(prevEnemies, enemies);

    if (enemiesToAdd.length) {
      await Club.updateMany(
        {
          _id: { $in: enemiesToAdd },
        },
        {
          $addToSet: {
            enemies: clubId,
          },
        },
      );
    }

    if (enemiesToRemove.length) {
      await Club.updateMany(
        {
          _id: { $in: enemiesToRemove },
        },
        {
          $pull: {
            enemies: clubId,
          },
        },
      );
    }

    // Derby Rivalries
    const {
      toAdd: derbyRivalriesToAdd,
      toRemove: derbyRivalriesToRemove,
    } = getRelationsToEdit(prevDerbyRivalries, derbyRivalries);

    if (derbyRivalriesToAdd.length) {
      await Club.updateMany(
        {
          _id: { $in: derbyRivalriesToAdd },
        },
        {
          $addToSet: {
            derbyRivalries: clubId,
          },
        },
      );
    }

    if (derbyRivalriesToRemove.length) {
      await Club.updateMany(
        {
          _id: { $in: derbyRivalriesToRemove },
        },
        {
          $pull: {
            derbyRivalries: clubId,
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

    if (prevSatelliteOf && prevSatelliteOf.toString() !== satelliteOf) { // removing
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

    const foundClubs = await Club.find({
      name: { $in: clubNames },
    });

    const {
      existingClubs,
      clubNamesToAdd,
    } = clubNames.reduce((acc, clubName) => {
      const maybeFound = foundClubs.find(foundClub => foundClub.name === clubName);
      if (maybeFound) {
        acc.existingClubs.push(maybeFound);
      } else {
        acc.clubNamesToAdd.push(clubName);
      }

      return acc;
    }, {
      existingClubs: [],
      clubNamesToAdd: [],
    });

    const clubsToAdd = clubNamesToAdd.map(clubName => ({
      name: clubName,
      location: {
        type: 'Point',
        coordinates: DEFAULT_COORDINATES,
      },
    }));

    const addedClubs = await Club.insertMany(clubsToAdd);

    await Promise.all(addedClubs.map(addedClub => new Promise(async (resolve, reject) => {
      try {
        const activity = new Activity({
          user,
          originalObject: addedClub,
          objectType: 'club',
          actionType: 'add',
          before: null,
          after: addedClub,
        });

        await activity.save();

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    ctx.body = {
      data: [...addedClubs, ...existingClubs],
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
    const {
      request: {
        body: {
          searchName,
          excluded = [],
        },
      },
    } = ctx;

    const searchRegExp = new RegExp(searchName, 'i');

    const clubs = await Club.find(
      {
        _id: { $nin: excluded },
        $or: [
          { name: searchRegExp },
          { searchName: searchRegExp },
          { transliterationName: searchRegExp },
        ],
      },
    ).limit(10);

    ctx.body = {
      data: clubs,
    };
  }

  getActivities = async (ctx) => {
    const { params } = ctx;
    const { clubId } = params;

    const activities = await Activity.find({ originalObject: clubId })
      .sort({ createdAt: 'descending' })
      .populate('user');

    ctx.body = {
      data: activities,
    };
  }

  bulkUpdateTiers = async (ctx) => {
    const {
      request: {
        body,
      },
    } = ctx;

    const toUpdateArr = Object.entries(body);

    await Promise.all(toUpdateArr.map(([clubId, tier]) => new Promise(async (resolve, reject) => {
      try {
        const club = await Club.findById(clubId);

        Object.assign(club, { tier });

        await club.save();

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    ctx.body = {
      success: true,
    };
  }

  estimateAttitude = async (ctx) => {
    const {
      queryParsed,
      params: {
        firstClubId,
        secondClubId,
      },
    } = ctx;

    const isFirstClubReserve = queryParsed.isFirstClubReserve === '1';
    const isSecondClubReserve = queryParsed.isSecondClubReserve === '1';
    const league = queryParsed.league ? await League.findById(queryParsed.league) : null;

    const result = await estimateClubsAttitude({
      firstClubId: firstClubId === 'unimportant' ? null : firstClubId,
      secondClubId: secondClubId === 'unimportant' ? null : secondClubId,
      isFirstClubReserve,
      isSecondClubReserve,
      league,
    });

    ctx.body = {
      data: result,
    };
  }

  searchByName = async (ctx) => {
    const { queryParsed } = ctx;
    const { search } = queryParsed;

    const maybeFoundClub = await Club.findByName(search);

    ctx.body = {
      data: maybeFoundClub || false,
    };
  }
}

export default new ClubsController();
