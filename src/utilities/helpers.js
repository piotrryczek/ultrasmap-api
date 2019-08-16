/**
 * TODO:
 * - Error handling
 */

import _intersection from 'lodash/intersection';
import _uniq from 'lodash/uniq';
import _cloneDeep from 'lodash/cloneDeep';
import fromEntries from 'object.fromentries';

import Club from '@models/club';
import User from '@models/user';
import Activity from '@models/activity';
import ApiError from './apiError';
import errorCodes from '../config/errorCodes';

export const convertObjectsIdsToStrings = (objectsIds = []) => objectsIds.map(objectId => objectId.toString());

export const createRelationsPromises = (updatedClubId, relations, relationsType, operationType) => relations.map(clubId => new Promise(async (resolve, reject) => {
  try {
    const club = await Club.findById(clubId);

    const relationsToUpdate = convertObjectsIdsToStrings(club[relationsType]);

    const updatedRelations = operationType === 'add'
      ? _uniq([...relationsToUpdate, updatedClubId]) // add
      : relationsToUpdate.filter(clubIdInRelation => clubIdInRelation !== updatedClubId); // remove

    Object.assign(club, {
      [relationsType]: updatedRelations,
    });

    await club.save();

    resolve();
  } catch (error) {
    reject(new ApiError(errorCodes.Internal));
  }
}));

export const getRelationsToEdit = (prevRelations, newRelations) => {
  const prevRelationsStrings = convertObjectsIdsToStrings(prevRelations);
  const relationsSame = _intersection(prevRelationsStrings, newRelations);

  return {
    toAdd: newRelations.filter(id => !relationsSame.includes(id)),
    toRemove: prevRelationsStrings.filter(prevId => !relationsSame.includes(prevId)),
  };
};

export const createSatellitesPromises = (satelliteOfId, satellites = [], operationType, canOverride = false) => {
  const finalSatellites = [];
  const satellitesPromises = satellites.map(satelliteId => new Promise(async (resolve, reject) => {
    const club = await Club.findById(satelliteId);

    if (!club.satelliteOf || canOverride) {
      finalSatellites.push(satelliteId);

      if (operationType === 'add') {
        Object.assign(club, {
          satelliteOf: satelliteOfId,
        });
      } else {
        Object.assign(club, {
          satelliteOf: null,
        });
      }

      await club.save();
    }

    resolve();
  }));

  return {
    finalSatellites,
    satellitesPromises,
  };
};

export const parseSearchQuery = searchQuery => fromEntries(Object.entries(searchQuery).map(([key, value]) => ([key, new RegExp(value, 'i')])));

export const singleUserRemove = async (userPerforming, userId) => {
  const userToBeRemoved = await User.findById(userId);
  const userToBeRemovedOriginal = _cloneDeep(userToBeRemoved);
  await userToBeRemoved.remove();

  const activity = new Activity({
    user: userPerforming,
    originalObject: null,
    objectType: 'user',
    actionType: 'remove',
    before: userToBeRemovedOriginal,
    after: null,
  });

  await activity.save();
};

export const singleClubDelete = async (userPerforming, clubId) => {
  const clubToBeRemoved = await Club.findById(clubId);

  const clubToBeRemovedOriginal = _cloneDeep(clubToBeRemoved);
  await clubToBeRemoved.remove();

  const activity = new Activity({
    user: userPerforming,
    originalObject: null,
    objectType: 'club',
    actionType: 'remove',
    before: clubToBeRemovedOriginal,
    after: null,
  });

  await activity.save();
};
