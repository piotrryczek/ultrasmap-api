import _intersection from 'lodash/intersection';
import _uniq from 'lodash/uniq';

import Club from '@models/club';

export const convertObjectsIdsToStrings = (objectsIds = []) => objectsIds.map(objectId => objectId.toString());

// @todo error handling
export const createRelationsPromises = (updatedClubId, relations, relationsType, operationType) => relations.map(clubId => new Promise(async (resolve, reject) => {
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
}));

export const getRelationsToEdit = (prevRelations, newRelations) => {
  const prevRelationsStrings = convertObjectsIdsToStrings(prevRelations);
  const relationsSame = _intersection(prevRelationsStrings, newRelations);

  return {
    toAdd: newRelations.filter(id => !relationsSame.includes(id)),
    toRemove: prevRelationsStrings.filter(prevId => !relationsSame.includes(prevId)),
  };
};
