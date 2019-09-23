import Club from '@models/club';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

const getTierModifier = (tier) => {
  return (tier ** 2) / 10 - ((tier ** 4) / 700);
};

const flattenAttitude = (attitude) => {
  if (attitude > 65) return 65;
  if (attitude < 10) return 10;

  return attitude;
}

const convertIdsToRelations = (relation, Ids) => Ids.map(id => ({
  relation,
  id: id.toString(),
}));

const convertRelationToAttitude = (relation) => {
  switch (relation) {
    case 'friendship': return 100;
    case 'agreement': return 85;
    case 'positive': return 70;
    case 'enemy': return 0;
    default: return 50;
  }
};

const getDivisionModifier = (type, relation) => {
  if (type === 'negative') {
    switch (relation) {
      case 'friendship': return 3;
      case 'agreement': return 5;
      case 'positive': return 7;
      default: throw new Error('Incorrect relation');
    }
  } else {
    switch (relation) {
      case 'friendship': return 6;
      case 'agreement': return 9;
      case 'positive': return 12;
      default: throw new Error('Incorrect relation');
    }
  }
};

const getSecondLevelAttitudeDelta = (relationOrigin, relation, tier) => {
  let attitudeDelta = 0;
  const tierModifier = getTierModifier(tier);

  if (relation === 'enemy') {
    const divisionModifier = getDivisionModifier('negative', relationOrigin);
    attitudeDelta = -(convertRelationToAttitude(relationOrigin) / divisionModifier);
  } else {
    const divisionModifier = getDivisionModifier('positive', relationOrigin);
    attitudeDelta = convertRelationToAttitude(relation) / divisionModifier;
  }

  return attitudeDelta * tierModifier;
};

const getClubRelationAttitudeDelta = (clubsProRelations, secondClubId, allRelations) => clubsProRelations.reduce((acc, club) => {
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
    const relationOrigin = allRelations.find(relation => relation.id === clubId.toString());
    const { relation } = maybeFoundRelationSecondLevel;

    const secondLevelAttitude = getSecondLevelAttitudeDelta(relationOrigin.relation, relation, tier);

    const finalAcc = acc || 0;
    return finalAcc + secondLevelAttitude;
  }

  return acc;
}, false);

const estimateClubsAttitude = async (firstClubId, secondClubId, terminateBeforeThirdLevel = false) => {
  const firstClub = await Club.findById(firstClubId);
  const secondClub = await Club.findById(secondClubId);

  const {
    tier: firstClubTier,
    friendships: firstClubFriendships = [],
    agreements: firstClubAgreements = [],
    positives: firstClubPositives = [],
    enemies: firstClubEnemies = [],
    derbyRivalries = [], // No difference which club they come from
    // satellites: firstClubSatellites = [],
    satelliteOf: firstClubSatelliteOfToParse,
  } = firstClub;
  const firstClubSatelliteOf = firstClubSatelliteOfToParse ? firstClubSatelliteOfToParse.toString() : false;

  const {
    tier: secondClubTier,
    friendships: secondClubFriendships = [],
    agreements: secondClubAgreements = [],
    positives: secondClubPositives = [],
    enemies: secondClubEnemies = [],
    // satellites: secondClubSatellites = [],
    satelliteOf: secondClubSatelliteOfToParse,
  } = secondClub;
  const secondClubSatelliteOf = secondClubSatelliteOfToParse ? secondClubSatelliteOfToParse.toString() : false;

  const resultBase = {
    firstClubId,
    secondClubId,
  };

  const importance = (firstClubTier + secondClubTier) / 2;
  const additional = [];

  if (derbyRivalries.includes(secondClubId)) {
    additional.push('derby');
  }

  // ----------------
  // First level
  // ----------------

  // Looking for direct relation - they have always priority over other relations
  const allFirstClubRelations = [
    ...convertIdsToRelations('friendship', firstClubFriendships),
    ...convertIdsToRelations('agreement', firstClubAgreements),
    ...convertIdsToRelations('positive', firstClubPositives),
    ...convertIdsToRelations('enemy', firstClubEnemies),
  ];

  const allSecondClubRelations = [
    ...convertIdsToRelations('friendship', secondClubFriendships),
    ...convertIdsToRelations('agreement', secondClubAgreements),
    ...convertIdsToRelations('positive', secondClubPositives),
    ...convertIdsToRelations('enemy', secondClubEnemies),
  ];

  const maybeFoundRelation = allFirstClubRelations.find(relation => relation.id === secondClubId);

  if (maybeFoundRelation) {
    // Result <=======
    return {
      ...resultBase,
      importance,
      additional,
      attitude: convertRelationToAttitude(maybeFoundRelation.relation),
      level: 1,
    };
  }

  // If one is satellite of the other
  if (
    (firstClubSatelliteOf === secondClubId)
    || (secondClubSatelliteOf === firstClubId)
  ) {
    // Result <=======
    return {
      ...resultBase,
      importance: importance / 2,
      additional: [...additional, 'satellite'],
      attitude: 100,
      level: 1,
    };
  }

  // ----------------
  // Second Level
  // ----------------

  // If any is being satellite of
  if (firstClubSatelliteOf || secondClubSatelliteOf) {
    const multiplyModifier = 0.7; // to weaken a little parent relation result

    // If both are satellites of
    if (firstClubSatelliteOf && secondClubSatelliteOf) {
      if (firstClubSatelliteOf === secondClubSatelliteOf) { // If they are both satellites of the same club
        return { // Result <=======
          ...resultBase,
          importance,
          additional,
          attitude: 70,
          level: 3,
        };
      }

      const data = await estimateClubsAttitude(firstClubSatelliteOf, secondClubSatelliteOf); // checking parents relations

      if (data !== 'unknown') {
        const { attitude } = data;

        const finalAttitude = attitude === 0
          ? 0 // if enemy stay enemy
          : flattenAttitude(50 * multiplyModifier + attitude / (multiplyModifier + 1)); // weaking parents relation

        // Result <=======
        return {
          ...resultBase,
          importance,
          additional,
          attitude: finalAttitude, // flatten
          level: 2.5,
        };
      }
    } else { // If one is satellite Of
      const satelliteOfId = firstClubSatelliteOf || secondClubSatelliteOf;
      // const satelliteOf = await Club.findById(satelliteOfId);
      const clubIdToCheck = firstClubSatelliteOf ? secondClubId : firstClubId;

      const data = await estimateClubsAttitude(satelliteOfId, clubIdToCheck); // checking relation between parent and other not being satellite

      if (data !== 'unknown') {
        const { attitude } = data;

        const finalAttitude = attitude === 0
          ? 0 // if enemy stay enemy
          : flattenAttitude((50 * multiplyModifier + attitude) / (multiplyModifier + 1)); // weaking parents relation

        // Result <=======
        return {
          ...resultBase,
          importance,
          additional,
          attitude: finalAttitude,
          level: 2.5,
        };
      }
    }
  }

  // Looking for second level relations
  const firstClubProRelationsIds = [...firstClubFriendships, ...firstClubAgreements, ...firstClubPositives];
  const firstClubsProRelations = await Club.find({ // pro - positive (friendships, agreement, positive only)
    _id: { $in: firstClubProRelationsIds },
  });


  const secondClubProRelationsIds = [...secondClubFriendships, ...secondClubAgreements, ...secondClubPositives];
  const secondClubsProRelations = await Club.find({ // pro - positive (friendships, agreement, positive only)
    _id: { $in: secondClubProRelationsIds },
  });


  const firstClubRelationsAttitudeDelta = getClubRelationAttitudeDelta(firstClubsProRelations, secondClubId, allFirstClubRelations);
  const secondClubRelationsAttitudeDelta = getClubRelationAttitudeDelta(secondClubsProRelations, firstClubId, allSecondClubRelations);

  if (firstClubRelationsAttitudeDelta || secondClubRelationsAttitudeDelta) {
    const attitude = 50 + (firstClubRelationsAttitudeDelta || 0) + (secondClubRelationsAttitudeDelta || 0);

    // Result <=======
    return {
      ...resultBase,
      importance,
      additional,
      attitude: flattenAttitude(attitude),
      level: 2,
    };
  }

  // ----------------
  // Third Level
  // ----------------

  if (!terminateBeforeThirdLevel) {
    const firstClubProResults = await Promise.all(firstClubProRelationsIds.map(id => new Promise(async (resolve, reject) => {
      try {
        const result = await estimateClubsAttitude(id.toString(), secondClubId, true);
        resolve(result);
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    const secondCLubProResults = await Promise.all(secondClubProRelationsIds.map(id => new Promise(async (resolve, reject) => {
      try {
        const result = await estimateClubsAttitude(id.toString(), firstClubId, true);
        resolve(result);
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    const finalProResults = [...firstClubProResults, ...secondCLubProResults].filter(result => result !== 'unknown');

    if (finalProResults.length) {
      const attitudeAvg = finalProResults.reduce((acc, result) => {
        const {
          importance: currentImportance,
          attitude: currentAttitude,
        } = result;

        const currentStrength = currentImportance * getTierModifier(currentImportance);

        const { value, strength } = acc;

        Object.assign(acc, {
          value: value + (currentAttitude * currentStrength),
          strength: strength + currentStrength,
        });

        return acc;
      }, {
        value: 0,
        strength: 0,
      });

      const {
        value,
        strength,
      } = attitudeAvg;

      const originalStrength = (finalProResults.length * 2) ** 1.2; // strengthen base relation

      const attitude = (50 * originalStrength + value) / (originalStrength + strength); // 50 - neutral

      // Result <=======
      return {
        ...resultBase,
        importance,
        additional,
        attitude: flattenAttitude(attitude),
        level: 3,
      };
    }
  }

  // Cannot calculate
  return 'unknown';
};

export default estimateClubsAttitude;
