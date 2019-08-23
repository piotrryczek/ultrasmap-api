/**
 * TODO:
 * - Error handling
 */

import _intersection from 'lodash/intersection';
import _cloneDeep from 'lodash/cloneDeep';
import fromEntries from 'object.fromentries';

import Club from '@models/club';
import User from '@models/user';
import Activity from '@models/activity';
import Suggestion from '@models/suggestion';

export const convertObjectsIdsToStrings = (objectsIds = []) => objectsIds.map(objectId => objectId.toString());

export const getRelationsToEdit = (prevRelations, newRelations) => {
  const prevRelationsStrings = convertObjectsIdsToStrings(prevRelations);
  const relationsSame = _intersection(prevRelationsStrings, newRelations);

  return {
    toAdd: newRelations.filter(id => !relationsSame.includes(id)),
    toRemove: prevRelationsStrings.filter(prevId => !relationsSame.includes(prevId)),
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
