import {
  PER_PAGE,
} from '@config/config';
import {
  createRelationsPromises,
  getRelationsToEdit,
  createSatellitesPromises,
} from '@utilities/helpers';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

import Club from '@models/club';
// import Relation from '@models/relation';


class ClubsController {
  getPaginated = async (ctx) => {
    const { query } = ctx;
    const { page } = query;

    const clubs = await Club.find(
      null,
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    );

    ctx.body = {
      data: clubs,
    };
  }

  get = async (ctx) => {
    const { params } = ctx;
    const { clubId } = params;

    const club = await Club.findById(clubId);

    ctx.body = {
      data: club,
    };
  }

  add = async (ctx) => {
    const { body } = ctx.request;

    const {
      name,
      logo,
      tier,
      location,
      // Relations
      friendships = [],
      agreements = [],
      positives = [],
      satellites = [],
      satelliteOf = null,
    } = body;

    const isClubWithName = await Club.findOne({ name });

    if (isClubWithName) throw new ApiError(errorCodes.ClubWithNameExists);

    const newClub = new Club({
      name,
      logo,
      tier,
      location,
      friendships,
      agreements,
      positives,
      satellites,
      satelliteOf,
    });

    if (!newClub.validateRelations()) throw new ApiError(errorCodes.RelationsNotUnique);
    await newClub.validate();

    // Saving
    const { _id: newClubId } = await newClub.save();

    // Satellites
    const { finalSatellites, satellitesPromises } = createSatellitesPromises(newClubId, satellites, 'add', true);
    await Promise.all(satellitesPromises);

    if (satellites.length !== finalSatellites.length) {
      Object.assign(newClub, {
        satellites: finalSatellites, // Cannot override
      });

      await newClub.save();
    }

    // Friendships
    const friendshipsPromises = createRelationsPromises(newClubId, friendships, 'friendships', 'add');
    await Promise.all(friendshipsPromises);

    // Agreements
    const agreementsPromises = createRelationsPromises(newClubId, agreements, 'agreements', 'add');
    await Promise.all(agreementsPromises);

    // Positives
    const positivesPromises = createRelationsPromises(newClubId, positives, 'positives', 'add');
    await Promise.all(positivesPromises);

    // SatelliteOf
    if (satelliteOf) {
      const club = await Club.findById(satelliteOf);
      const { satellites: clubSatellites } = club;

      Object.assign(club, {
        satellites: [...clubSatellites, newClubId],
      });

      await club.save();
    }

    ctx.body = {
      data: newClubId,
    };
  }

  update = async (ctx) => {
    const {
      params: {
        clubId,
      },
      request: {
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
      friendships = [],
      agreements = [],
      positives = [],
      satellites = [],
      satelliteOf = null,
    } = body;

    const clubToBeUpdated = await Club.findById(clubId);

    Object.assign(clubToBeUpdated, {
      name,
      logo,
      tier,
      location,
      friendships,
      agreements,
      positives,
      satellites,
      satelliteOf,
    });

    if (!clubToBeUpdated.validateRelations()) throw new ApiError(errorCodes.RelationsNotUnique);
    await clubToBeUpdated.validate();

    // Satellites
    const {
      toAdd: satellitesToAdd,
      toRemove: satellitesToRemove,
    } = getRelationsToEdit(prevSatellites, satellites);
    const { finalSatellites, satellitesPromises: satellitesToAddPromises } = createSatellitesPromises(clubId, satellitesToAdd, 'add', true);
    const { satellitesPromises: satellitesToRemovePromises } = createSatellitesPromises(clubId, satellitesToRemove, 'remove', true);

    await Promise.all(satellitesToAddPromises, satellitesToRemovePromises);

    // Saving
    Object.assign(clubToBeUpdated, {
      satellites: finalSatellites, // Cannot override
    });

    await clubToBeUpdated.save();

    // Friendships
    const {
      toAdd: friendshipsToAdd,
      toRemove: friendshipsToRemove,
    } = getRelationsToEdit(prevFriendships, friendships);
    const friendshipsToAddPromises = createRelationsPromises(clubId, friendshipsToAdd, 'friendships', 'add');
    const friendshipsToRemovePromises = createRelationsPromises(clubId, friendshipsToRemove, 'friendships', 'remove');
    await Promise.all(friendshipsToAddPromises, friendshipsToRemovePromises);

    // Agreements
    const {
      toAdd: agreementsToAdd,
      toRemove: agreementsToRemove,
    } = getRelationsToEdit(prevAgreements, agreements);
    const agreementsToAddPromises = createRelationsPromises(clubId, agreementsToAdd, 'agreements', 'add');
    const agreementsToRemovePromises = createRelationsPromises(clubId, agreementsToRemove, 'agreements', 'remove');
    await Promise.all(agreementsToAddPromises, agreementsToRemovePromises);

    // Positives
    const {
      toAdd: positivesToAdd,
      toRemove: positivesToRemove,
    } = getRelationsToEdit(prevPositives, positives);
    const positivesToAddPromises = createRelationsPromises(clubId, positivesToAdd, 'positives', 'add');
    const positivesToRemovePromises = createRelationsPromises(clubId, positivesToRemove, 'positives', 'remove');
    await Promise.all(positivesToAddPromises, positivesToRemovePromises);

    // SatelliteOf
    if (satelliteOf) { // adding satellite to satellites
      const club = await Club.findById(satelliteOf);
      const { satellites: clubSatellites } = club;

      Object.assign(club, {
        satellites: [...clubSatellites, clubId],
      });

      await club.save();
    }

    if (prevSatelliteOf !== satelliteOf) { // removing
      const club = await Club.findById(prevSatelliteOf);
      const { satellites: clubSatellites } = club;

      Object.assign(club, {
        satellites: clubSatellites.filter(satelliteId => satelliteId.toString() !== clubId),
      });

      await club.save();
    }

    ctx.body = {
      success: true,
    };
  }

  remove = async (ctx) => {
    const { params } = ctx;
    const { clubId } = params;

    await Club.findByIdAndRemove(clubId);

    ctx.body = {
      success: true,
    };
  }
}

export default new ClubsController();
