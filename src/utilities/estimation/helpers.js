import getDistance from 'geolib/es/getDistance';

import {
  getImportanceModifierBasedOnAttitude,
  getDistanceModifier,
  // getTierModifier,
  getTierDiffModiifer,
  getRelationTypeModifier,
} from '@utilities/estimation/modifiers';

export const flattenAttitude = (attitude) => {
  if (attitude > 65) return 65;
  if (attitude < 10) return 10;

  return attitude;
};

export const convertIdsToRelations = (relation, Ids) => Ids.map(id => ({
  relation,
  id: id.toString(),
}));

export const convertRelationToAttitude = (relation) => {
  switch (relation) {
    case 'friendship': return 100;
    case 'agreement': return 85;
    case 'positive': return 70;
    case 'enemy': return 0;
    default: return 50;
  }
};

export const getDistanceBetweenClubs = (clubA, clubB) => {
  const {
    location: {
      coordinates: [aLng, aLat],
    },
  } = clubA;


  const {
    location: {
      coordinates: [bLng, bLat],
    },
  } = clubB;

  return getDistance({ latitude: aLat, longitude: aLng }, { latitude: bLat, longitude: bLng }) / 1000; // to kilometers
};

export const prepareResult = ({
  resultBase,
  importance,
  additional = [],
  attitude,
  level,
}) => {
  const { distance } = resultBase;

  const isDerby = additional.includes('derby');

  const attitudeModifier = attitude !== 'unknown' ? getImportanceModifierBasedOnAttitude(attitude) : 1;
  const derbyModifier = isDerby ? 1.5 : 1;
  const distanceModifier = isDerby ? 1 : getDistanceModifier(distance);

  const finalImportance = importance * attitudeModifier * derbyModifier * distanceModifier;

  return {
    ...resultBase,
    importance: Math.round(finalImportance * 100) / 100,
    additional,
    attitude: attitude === 'unknown' ? attitude : Math.round(attitude * 100) / 100,
    level,
  };
};

export const getSecondLevelClubsRelationsAttitude = (baseClubTier, clubsProRelations, secondClubId, allRelations) => clubsProRelations.reduce((acc, club) => {
  const {
    _id: clubId,
    tier,
    friendships,
    agreements,
    positives,
    enemies,
  } = club;

  const clubRelations = [
    ...convertIdsToRelations('friendship', friendships),
    ...convertIdsToRelations('agreement', agreements),
    ...convertIdsToRelations('positive', positives),
    ...convertIdsToRelations('enemy', enemies),
  ];

  const maybeFoundRelationSecondLevel = clubRelations.find(relation => relation.id === secondClubId);

  if (maybeFoundRelationSecondLevel) {
    const { relation: relationOrigin } = allRelations.find(relation => relation.id === clubId.toString());
    const { relation } = maybeFoundRelationSecondLevel;

    // const tierModifier = getTierModifier(tier);
    const tierDiff = tier - baseClubTier;
    const tierDiffModifier = 1 + getTierDiffModiifer(tierDiff);
    const relationOriginTypeModifier = getRelationTypeModifier(relationOrigin);
    const relationTypeModifier = getRelationTypeModifier(relation);

    const finalModifier = tierDiffModifier * relationOriginTypeModifier * relationTypeModifier;

    acc.push({
      attitude: convertRelationToAttitude(relation),
      strength: finalModifier,
      clubId,
    });
  }

  return acc;
}, []);
