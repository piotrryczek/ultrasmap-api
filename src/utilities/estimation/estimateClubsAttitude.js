import Club from '@models/club';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

import {
  getTierModifier,
  getRelationTypeModifier,
  getImportanceDiffModifier,
} from '@utilities/estimation/modifiers';
import {
  getDistanceBetweenClubs,
  convertIdsToRelations,
  convertRelationToAttitude,
  prepareResult,
  flattenAttitude,
  getSecondLevelClubsRelationsAttitude,
} from '@utilities/estimation/helpers';


const SECOND_LEVEL_WAGE = 5;
const THIRD_LEVEL_WAGE = 9;
const FOURTH_LEVEL_WAGE = 16;

const ONE_CLUB_UNIMPORTANT_DIVISION = 6;
const RESERVE_DIVISION = 14;

const results = {
  UNKNOWN: 'unknown',
  UNIMPORTANT: 'unimportant',
};

const estimateClubsAttitude = async ({
  firstClubId = null,
  secondClubId = null,
  terminateBeforeThirdLevel = false,
  isFirstClubReserve = false,
  isSecondClubReserve = false,
  league = null,
}) => {
  let baseAttitude = 50;

  if (!firstClubId && !secondClubId) return results.UNIMPORTANT;

  const leagueImportanceModifier = league ? league.importanceModifier : 1;

  const firstClub = firstClubId ? await Club.findById(firstClubId) : null;
  const secondClub = secondClubId ? await Club.findById(secondClubId) : null;

  if (!firstClub || !secondClubId) { // One club is completely unimportant
    const onlyClub = firstClub || secondClub;

    const { tier } = onlyClub;

    const importance = (tier / ONE_CLUB_UNIMPORTANT_DIVISION) * leagueImportanceModifier;

    return ({
      importance: Math.round(importance * 100) / 100,
      attitude: 50,
      level: 1,
    });
  }

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
  const firstClubSatelliteOf = firstClubSatelliteOfToParse ? firstClubSatelliteOfToParse.toString() : null;
  const firstClubTierForImportance = isFirstClubReserve ? firstClubTier / RESERVE_DIVISION : firstClubTier;

  const {
    tier: secondClubTier,
    friendships: secondClubFriendships = [],
    agreements: secondClubAgreements = [],
    positives: secondClubPositives = [],
    enemies: secondClubEnemies = [],
    // satellites: secondClubSatellites = [],
    satelliteOf: secondClubSatelliteOfToParse,
  } = secondClub;
  const secondClubSatelliteOf = secondClubSatelliteOfToParse ? secondClubSatelliteOfToParse.toString() : null;
  const secondClubTierForImportance = isSecondClubReserve ? secondClubTier / RESERVE_DIVISION : secondClubTier;

  const resultBase = {
    firstClubId,
    secondClubId,
    distance: getDistanceBetweenClubs(firstClub, secondClub),
  };

  const importanceDiffModifier = getImportanceDiffModifier(Math.abs(firstClubTierForImportance - secondClubTierForImportance)); // smaller diff bigger importance and opposite
  const importance = ((firstClubTierForImportance + secondClubTierForImportance) / 2) * importanceDiffModifier * leagueImportanceModifier;
  const additional = [];

  if (derbyRivalries.includes(secondClubId)) {
    additional.push('derby');
  }

  // ----------------
  // First level: Direct relation
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
    return prepareResult({
      resultBase,
      importance,
      additional,
      attitude: convertRelationToAttitude(maybeFoundRelation.relation),
      level: 1,
    });
  }

  // If one is satellite of the other
  if (
    (firstClubSatelliteOf === secondClubId)
    || (secondClubSatelliteOf === firstClubId)
  ) {
    // Result <=======

    return prepareResult({
      resultBase,
      importance: importance / 3,
      additional: [...additional, 'satellite'],
      attitude: 100,
      level: 1,
    });
  }

  // ----------------
  // Second Level: Direct relation between (PRO-A -> B) AND (PRO-B -> A)
  // ----------------

  // If any is being satellite of
  if (firstClubSatelliteOf || secondClubSatelliteOf) {
    const multiplyModifier = 0.7; // to weaken a little parent relation result

    // If both are satellites of
    if (firstClubSatelliteOf && secondClubSatelliteOf) {
      if (firstClubSatelliteOf === secondClubSatelliteOf) { // If they are both satellites of the same club
        // Result <=======
        return prepareResult({
          resultBase,
          importance,
          additional,
          attitude: 70,
          level: 1,
        });
      }

      const data = await estimateClubsAttitude({
        firstClubId: firstClubSatelliteOf,
        secondClubId: secondClubSatelliteOf,
      }); // checking parents relations

      const { attitude, level } = data;

      if (attitude !== results.UNKNOWN) {
        const finalAttitude = attitude === 0
          ? 0 // if enemy stay enemy
          : flattenAttitude(baseAttitude * multiplyModifier + attitude / (multiplyModifier + 1)); // weakening parents relation

        // Result <=======
        return prepareResult({
          resultBase,
          importance,
          additional,
          attitude: finalAttitude, // flatten
          level,
        });
      }
    } else { // If one is satellite Of
      const satelliteOfId = firstClubSatelliteOf || secondClubSatelliteOf;
      const clubIdToCheck = firstClubSatelliteOf ? secondClubId : firstClubId;

      const data = await estimateClubsAttitude({
        firstClubId: satelliteOfId,
        secondClubId: clubIdToCheck,
      }); // checking relation between parent and other not being satellite

      const { attitude, level } = data;

      if (attitude !== results.UNKNOWN) {
        const finalAttitude = attitude === 0
          ? 0 // if enemy stay enemy
          : flattenAttitude((baseAttitude * multiplyModifier + attitude) / (multiplyModifier + 1)); // weakening parents relation

        // Result <=======
        return prepareResult({
          resultBase,
          importance,
          additional,
          attitude: finalAttitude,
          level,
        });
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


  const secondLevelFirstClubsRelationsAttitude = getSecondLevelClubsRelationsAttitude(firstClubsProRelations, secondClubId, allFirstClubRelations);
  const secondLevelSecondClubsRelationsAttitude = getSecondLevelClubsRelationsAttitude(secondClubsProRelations, firstClubId, allSecondClubRelations);

  const secondLevelRelationsAttitudes = [
    ...secondLevelFirstClubsRelationsAttitude,
    ...secondLevelSecondClubsRelationsAttitude,
  ];

  if (secondLevelRelationsAttitudes.length) {
    const attitudeAvg = secondLevelRelationsAttitudes.reduce((acc, result) => {
      const {
        strength: currentStrength,
        attitude: currentAttitude,
      } = result;

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

    const originalStrength = SECOND_LEVEL_WAGE; // strengthen base relation

    const attitude = (baseAttitude * originalStrength + value) / (originalStrength + strength);

    // Result <=======
    baseAttitude = flattenAttitude(attitude);

    if (terminateBeforeThirdLevel) {
      return prepareResult({
        resultBase,
        importance,
        additional,
        attitude: baseAttitude,
        level: 2,
      });
    }
  }

  // ----------------
  // Third Level: Calculate attitude till (including) 2nd level between (PRO-A -> B) AND (PRO-B -> A)
  // ----------------

  if (!terminateBeforeThirdLevel) {
    const filteredFirstClubProRelationsIds = firstClubProRelationsIds.filter(id => !secondLevelFirstClubsRelationsAttitude.find(secondLevelRelation => secondLevelRelation.clubId.toString() === id.toString()));

    const filteredSecondClubProRelationsIds = secondClubProRelationsIds.filter(id => !secondLevelSecondClubsRelationsAttitude.find(secondLevelRelation => secondLevelRelation.clubId.toString() === id.toString()));

    const firstClubProResults = await Promise.all(filteredFirstClubProRelationsIds.map(id => new Promise(async (resolve, reject) => {
      try {
        const clubId = id.toString();
        const result = await estimateClubsAttitude({
          firstClubId: clubId,
          // eslint-disable-next-line object-shorthand
          secondClubId: secondClubId,
          terminateBeforeThirdLevel: true,
        });

        const { attitude } = result;
        const finalResult = attitude !== results.UNKNOWN
          ? {
            ...result, // importance, attitude
            relationType: allFirstClubRelations.find(relation => relation.id === clubId).relation,
          }
          : null;

        resolve(finalResult);
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    const secondClubProResults = await Promise.all(filteredSecondClubProRelationsIds.map(id => new Promise(async (resolve, reject) => {
      try {
        const clubId = id.toString();
        const result = await estimateClubsAttitude({
          firstClubId: clubId,
          secondClubId: firstClubId,
          terminateBeforeThirdLevel: true,
        });

        const { attitude } = result;
        const finalResult = attitude !== results.UNKNOWN
          ? {
            ...result, // importance, attitude
            relationType: allSecondClubRelations.find(relation => relation.id === clubId).relation,
          }
          : null;

        resolve(finalResult);
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    const finalProResults = [...firstClubProResults, ...secondClubProResults].filter(result => result !== null);

    if (finalProResults.length) {
      const attitudeAvg = finalProResults.reduce((acc, result) => {
        const {
          importance: currentImportance,
          attitude: currentAttitude,
          relationType: currentRelationType,
        } = result;

        const currentStrength = currentImportance
          * getTierModifier(currentImportance) // Consider strength of the club
          * getRelationTypeModifier(currentRelationType); // Consider type of the relation

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

      const originalStrength = THIRD_LEVEL_WAGE; // strengthen base relation

      const attitude = (baseAttitude * originalStrength + value) / (originalStrength + strength);

      // Result <=======
      return prepareResult({
        resultBase,
        importance,
        additional,
        attitude: flattenAttitude(attitude),
        level: 2,
      });
    }
  }


  // ----------------
  // Fourth Level: Calculate attitude till (incuding) 2nd level between every (PRO-A <-> PRO-B)
  // ----------------

  if (!terminateBeforeThirdLevel) {
    const pairsToCompare = firstClubProRelationsIds.reduce((acc, firstClubProIdObject) => {
      const firstClubProId = firstClubProIdObject.toString();

      secondClubProRelationsIds.forEach((secondClubProIdObject) => {
        const secondClubProId = secondClubProIdObject.toString();

        if (!acc.find(({ clubA, clubB }) => (clubA === firstClubProId || clubA === secondClubProId) && (clubB === firstClubProId || clubB === secondClubProId))) {
          acc.push({
            clubA: firstClubProId,
            clubB: secondClubProId,
            relationA: allFirstClubRelations.find(relation => relation.id === firstClubProId).relation,
            relationB: allSecondClubRelations.find(relation => relation.id === secondClubProId).relation,
          });
        }
      });

      return acc;
    }, []);

    const proResults = await Promise.all(pairsToCompare.map(({
      clubA,
      clubB,
      relationA,
      relationB,
    }) => new Promise(async (resolve, reject) => {
      try {
        const result = await estimateClubsAttitude({
          firstClubId: clubA,
          secondClubId: clubB,
          terminateBeforeThirdLevel: true,
        });

        const { attitude } = result;
        const finalResult = attitude !== results.UNKNOWN
          ? {
            ...result, // importance, attitude
            relationA,
            relationB,
          }
          : null;

        resolve(finalResult);
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    const finalProResults = proResults.filter(result => result !== null);

    if (finalProResults.length) {
      const attitudeAvg = finalProResults.reduce((acc, result) => {
        const {
          importance: currentImportance,
          attitude: currentAttitude,
          relationA,
          relationB,
        } = result;

        const currentStrength = currentImportance
          * getTierModifier(currentImportance) // Consider strength of the club
          * getRelationTypeModifier(relationA) // Consider type of the relation
          * getRelationTypeModifier(relationB);

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

      const originalStrength = FOURTH_LEVEL_WAGE; // strengthen base relation

      const attitude = (baseAttitude * originalStrength + value) / (originalStrength + strength);

      // Result <=======
      return prepareResult({
        resultBase,
        importance,
        additional,
        attitude: flattenAttitude(attitude),
        level: 3,
      });
    }
  }

  // Cannot calculate
  return prepareResult({
    resultBase,
    importance,
    attitude: results.UNKNOWN,
  });
};

export default estimateClubsAttitude;
