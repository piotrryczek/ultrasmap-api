import _intersection from 'lodash/intersection';
import _cloneDeep from 'lodash/cloneDeep';
import _set from 'lodash/set';
import fromEntries from 'object.fromentries';
import { promisify } from 'util';
import request from 'request';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

import Club from '@models/club';
import Role from '@models/role';
import User from '@models/user';
import Activity from '@models/activity';
import Suggestion from '@models/suggestion';
import EmailSender from '@services/emailSender';
import League from '@models/league';

const requestPromisify = promisify(request);

export const convertObjectsIdsToStrings = (objectsIds = []) => objectsIds.map(objectId => objectId.toString());

export const getRelationsToEdit = (prevRelations, newRelations) => {
  const prevRelationsStrings = convertObjectsIdsToStrings(prevRelations);
  const relationsSame = _intersection(prevRelationsStrings, newRelations);

  return {
    toAdd: newRelations.filter(id => !relationsSame.includes(id)),
    toRemove: prevRelationsStrings.filter(prevId => !relationsSame.includes(prevId)),
  };
};

export const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseSearchQuery = searchQuery => fromEntries(Object.entries(searchQuery).map(([key, { type, value }]) => {
  switch (type) {
    case 'text':
      return [key, new RegExp(escapeRegExp(value), 'i')];

    default:
    case 'select':
      return [key, value];
  }
}));

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

  await Suggestion.updateMany(
    {
      original: clubId,
    },
    {
      original: null,
      type: 'new',
    },
  );

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

export const getAdminsAndModerators = async () => {
  const adminAndModeratorRoles = await Role.find({
    name: { $in: ['moderator', 'admin'] },
  });

  const users = await User.find(
    {
      role: { $in: adminAndModeratorRoles },
    },
    '-password',
  );

  return users;
};

export const createSuggestionsSummary = async () => {
  const adminsAndModerators = await getAdminsAndModerators();

  const pendingSuggestions = await Suggestion.find({
    status: 'pending',
  });

  if (!pendingSuggestions.length) return false;

  const suggestionsHtml = await Promise.all(pendingSuggestions.map(suggestion => new Promise(async (resolve, reject) => {
    try {
      const clubName = await suggestion.getClubName();
      const typeLabel = suggestion.type === 'new' ? 'Nowy' : 'Zmiana';

      resolve(`<li>Dla: ${clubName} (${typeLabel})</li>`);
    } catch (error) {
      reject(new ApiError(errorCodes.Internal, error));
    }
  })));

  EmailSender.sendEmail({
    to: adminsAndModerators.map(({ email }) => email),
    subject: `Sugestie (${pendingSuggestions.length}) oczekują na weryfikację (${process.env.ADMIN_URL})`,
    html: `<ul>${suggestionsHtml.join('')}</ul>`,
  });
};

const clubIdsToObjects = (ids, clubs) => ids.map((id) => {
  const finalClub = clubs.find(({ _id: clubId }) => clubId.toString() === id.toString());

  return finalClub || null;
});

export const fillRelationshipsClubsByIdForActivity = (activity, clubs) => {
  const {
    before,
    after: {
      friendships: afterFriendships = [],
      agreements: afterAgreements = [],
      positives: afterPositives = [],
      enemies: afterEnemies = [],
      derbyRivalries: afterDerbyRivalries = [],
      satellites: afterSatellites = [],
      satelliteOf: afterSatelliteOf,
    },
  } = activity;

  if (before) {
    const {
      friendships: beforeFriendships = [],
      agreements: beforeAgreements = [],
      positives: beforePositives = [],
      enemies: beforeEnemies = [],
      derbyRivalries: beforeDerbyRivalries = [],
      satellites: beforeSatellites = [],
      satelliteOf: beforeSatelliteOf,
    } = before;

    if (beforeFriendships && beforeFriendships.length) _set(activity, 'before.friendships', clubIdsToObjects(beforeFriendships, clubs));
    if (beforeAgreements && beforeAgreements.length) _set(activity, 'before.agreements', clubIdsToObjects(beforeAgreements, clubs));
    if (beforePositives && beforePositives.length) _set(activity, 'before.positives', clubIdsToObjects(beforePositives, clubs));
    if (beforeEnemies && beforeEnemies.length) _set(activity, 'before.enemies', clubIdsToObjects(beforeEnemies, clubs));
    if (beforeDerbyRivalries && beforeDerbyRivalries.length) _set(activity, 'before.derbyRivalries', clubIdsToObjects(beforeDerbyRivalries, clubs));
    if (beforeSatellites && beforeSatellites.length) _set(activity, 'before.satellites', clubIdsToObjects(beforeSatellites, clubs));
    if (beforeSatelliteOf) _set(activity, 'before.satelliteOf', clubs.find(club => club._id.toString() === beforeSatelliteOf.toString()) || null);
  }

  if (afterFriendships && afterFriendships.length) _set(activity, 'after.friendships', clubIdsToObjects(afterFriendships, clubs));
  if (afterAgreements && afterAgreements.length) _set(activity, 'after.agreements', clubIdsToObjects(afterAgreements, clubs));
  if (afterPositives && afterPositives.length) _set(activity, 'after.positives', clubIdsToObjects(afterPositives, clubs));
  if (afterEnemies && afterEnemies.length) _set(activity, 'after.enemies', clubIdsToObjects(afterEnemies, clubs));
  if (afterDerbyRivalries && afterDerbyRivalries.length) _set(activity, 'after.derbyRivalries', clubIdsToObjects(afterDerbyRivalries, clubs));
  if (afterSatellites && afterSatellites.length) _set(activity, 'after.satellites', clubIdsToObjects(afterSatellites, clubs));
  if (afterSatelliteOf) _set(activity, 'after.satelliteOf', clubs.find(club => club._id.toString() === afterSatelliteOf.toString()) || null);
};

export const downloadMatchesForAllLeagues = async () => {
  const leagues = await League.find({
    isAutomaticDownload: true,
  });

  const results = await Promise.all(leagues.map(league => new Promise(async (resolve, reject) => {
    try {
      const result = await league.downloadMatches();

      resolve(result);
    } catch (error) {
      reject(new ApiError(errorCodes.Internal, error));
    }
  })));

  const all = results.reduce((acc, result) => {
    const { added, updated } = result;

    acc.added += added;
    acc.updated += updated;

    return acc;
  }, { added: 0, updated: 0 });

  return {
    added: all.added,
    updated: all.updated,
    leagues: results,
  };
};

export const googleMapsSearchForAddress = async (address) => {
  const googleMapsRequestUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAP_API_KEY}`;

  const { body } = await requestPromisify(googleMapsRequestUrl);

  if (!body) return null;

  const parsedResponse = JSON.parse(body);

  const { results, error_message: errorMessage } = parsedResponse;

  if (!results.length) {
    if (errorMessage === 'The provided API key is expired.') {
      return googleMapsSearchForAddress(address);
    }

    return null;
  }

  const { location } = results[0].geometry;

  return location;
};
